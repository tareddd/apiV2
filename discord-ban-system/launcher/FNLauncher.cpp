// FN Private Launcher — GLOW style exact
// cl /EHsc /O2 /Fe:FNPrivateLauncher.exe FNLauncher.cpp wininet.lib user32.lib gdi32.lib comctl32.lib shell32.lib ole32.lib dwmapi.lib /link /SUBSYSTEM:WINDOWS
#define UNICODE
#define _UNICODE
#include <windows.h>
#include <wininet.h>
#include <shlobj.h>
#include <commctrl.h>
#include <dwmapi.h>
#include <string>
#include <vector>
#include <fstream>
#include <thread>
#include <atomic>
#include <cmath>
#include <cstdlib>
#include <ctime>
#pragma comment(lib,"wininet.lib")
#pragma comment(lib,"gdi32.lib")
#pragma comment(lib,"comctl32.lib")
#pragma comment(lib,"shell32.lib")
#pragma comment(lib,"ole32.lib")
#pragma comment(lib,"dwmapi.lib")

// Palette GLOW exacte
#define C_BG     RGB(13,15,25)
#define C_SIDE   RGB(17,20,32)
#define C_BG2    RGB(22,26,40)
#define C_BG3    RGB(28,32,50)
#define C_BORDER RGB(38,44,68)
#define C_ACCENT RGB(99,102,241)
#define C_CYAN   RGB(6,182,212)
#define C_CYAN2  RGB(34,211,238)
#define C_TEXT   RGB(241,245,249)
#define C_MUTED  RGB(100,116,139)
#define C_OK     RGB(16,185,129)
#define C_ERR    RGB(239,68,68)
#define C_WARN   RGB(245,158,11)
#define SIDE_W   210
#define HEAD_H   52

#define PAGE_KEY    0
#define PAGE_HOME   1
#define PAGE_PARAMS 2
#define PAGE_LOGS   3
#define IDT_ANIM   1
#define IDB_LAUNCH 11
#define IDB_BROWSE 12
#define IDB_SAVE   13
#define IDB_VALKEY 14
#define IDE_KEY    20
#define IDE_PATH   21
#define IDE_LOGS   22

static const char* API_HOST="localhost";
static const int   API_PORT=3000;
static const wchar_t* CFG=L"fnlauncher.cfg";

static const char* API_HOST="localhost";
static const int   API_PORT=3000;
static const wchar_t* CFG=L"fnlauncher.cfg";

struct Star{float x,y,r,a,da,vx,vy;int ct;};

static HWND g_wnd,g_eKey,g_ePath,g_eLogs,g_bLaunch,g_bBrowse,g_bSave,g_bValKey;
static HFONT g_fTitle,g_fBig,g_fNorm,g_fSmall,g_fMono;
static HBRUSH g_brBg2;
static int g_page=PAGE_KEY,g_W=960,g_H=580;
static std::wstring g_status=L"Entre ta cle pour acceder au launcher";
static COLORREF g_statusCol=C_MUTED;
static std::vector<Star> g_stars;
static HDC g_mdc=NULL;static HBITMAP g_mbmp=NULL;
static std::atomic<bool> g_verified(false);
static std::atomic<bool> g_validating(false);
static bool g_drag=false;static POINT g_dragPt={};
static int g_hoverNav=-1;
static std::wstring g_username=L"";

static HFONT MkFont(int sz,int w,const wchar_t* f){return CreateFont(sz,0,0,0,w,0,0,0,DEFAULT_CHARSET,0,0,CLEARTYPE_QUALITY,0,f);}
static void SetSt(const std::wstring& m,COLORREF c){g_status=m;g_statusCol=c;InvalidateRect(g_wnd,NULL,FALSE);}
static void Log(const std::wstring& l){int n=GetWindowTextLength(g_eLogs);SendMessage(g_eLogs,EM_SETSEL,n,n);SendMessage(g_eLogs,EM_REPLACESEL,FALSE,(LPARAM)(l+L"\r\n").c_str());}
static void SaveCfg(){wchar_t p[512]={},k[256]={};GetWindowText(g_ePath,p,511);GetWindowText(g_eKey,k,255);std::wofstream f(CFG);if(f.is_open())f<<p<<L"\n"<<k<<L"\n";}
static void LoadCfg(){std::wifstream f(CFG);if(!f.is_open())return;std::wstring p,k;std::getline(f,p);std::getline(f,k);if(!p.empty())SetWindowText(g_ePath,p.c_str());if(!k.empty())SetWindowText(g_eKey,k.c_str());}

static std::string HttpPost(const char* host,int port,const char* path,const char* body){
    HINTERNET hi=InternetOpenA("FNL",INTERNET_OPEN_TYPE_DIRECT,NULL,NULL,0);if(!hi)return"";
    HINTERNET hc=InternetConnectA(hi,host,port,NULL,NULL,INTERNET_SERVICE_HTTP,0,0);if(!hc){InternetCloseHandle(hi);return"";}
    const char* t[]={"application/json",NULL};
    HINTERNET hr=HttpOpenRequestA(hc,"POST",path,NULL,NULL,t,0,0);if(!hr){InternetCloseHandle(hc);InternetCloseHandle(hi);return"";}
    std::string hdr="Content-Type: application/json\r\n";
    HttpSendRequestA(hr,hdr.c_str(),(DWORD)hdr.size(),(LPVOID)body,(DWORD)strlen(body));
    char buf[2048]={};DWORD rd=0;std::string r;
    while(InternetReadFile(hr,buf,sizeof(buf)-1,&rd)&&rd>0){buf[rd]=0;r+=buf;rd=0;}
    InternetCloseHandle(hr);InternetCloseHandle(hc);InternetCloseHandle(hi);return r;
}
static std::string JsonVal(const std::string& j,const std::string& k){
    std::string kq="\""+k+"\":\"";auto p=j.find(kq);
    if(p!=std::string::npos){p+=kq.size();auto e=j.find('"',p);return j.substr(p,e-p);}
    kq="\""+k+"\":";p=j.find(kq);if(p==std::string::npos)return"";
    p+=kq.size();auto e=j.find_first_of(",}",p);return j.substr(p,e-p);
}
static std::wstring FindWin64(const std::wstring& base){
    std::wstring b=base;if(!b.empty()&&b.back()!=L'\\')b+=L'\\';
    std::vector<std::wstring> c={b,b+L"FortniteGame\\Binaries\\Win64\\",b+L"Engine\\Binaries\\Win64\\",b+L"Binaries\\Win64\\"};
    for(auto& x:c){std::wstring t=x+L"FortniteClient-Win64-Shipping.exe";if(GetFileAttributesW(t.c_str())!=INVALID_FILE_ATTRIBUTES)return x;}
    return b;
}
static bool Launch(const std::wstring& dir,const std::wstring& exe,const std::wstring& args=L""){
    std::wstring full=dir+exe;if(GetFileAttributesW(full.c_str())==INVALID_FILE_ATTRIBUTES)return false;
    std::wstring cmd=L"\""+full+L"\"";if(!args.empty())cmd+=L" "+args;
    STARTUPINFOW si={};si.cb=sizeof(si);PROCESS_INFORMATION pi={};
    BOOL r=CreateProcessW(full.c_str(),(LPWSTR)cmd.c_str(),NULL,NULL,FALSE,DETACHED_PROCESS,NULL,dir.c_str(),&si,&pi);
    if(r){CloseHandle(pi.hProcess);CloseHandle(pi.hThread);}return r==TRUE;
}

static void SetPage(int p);
static void UnlockNav();

static DWORD WINAPI ValidateThread(LPVOID){
    g_validating=true;
    wchar_t kbuf[256]={};GetWindowText(g_eKey,kbuf,255);
    if(!wcslen(kbuf)){SetSt(L"Entre ta cle d'abord.",C_WARN);EnableWindow(g_bValKey,TRUE);g_validating=false;return 0;}
    std::string key(kbuf,kbuf+wcslen(kbuf));
    SetSt(L"Validation de la cle...",C_CYAN);
    std::string body="{\"key\":\""+key+"\"}";
    std::string resp=HttpPost(API_HOST,API_PORT,"/api/keys/validate",body.c_str());
    if(resp.empty()){SetSt(L"Serveur inaccessible. Lance npm start.",C_ERR);EnableWindow(g_bValKey,TRUE);g_validating=false;return 0;}
    std::string valid=JsonVal(resp,"valid");
    std::string userId=JsonVal(resp,"userId");
    if(valid=="true"){
        g_verified=true;
        if(!userId.empty()){std::wstring wu(userId.begin(),userId.end());g_username=wu;}
        SaveCfg();
        UnlockNav();
        SetPage(PAGE_HOME);
        SetSt(L"Cle valide ! Bienvenue.",C_OK);
        Log(L"  [+] Cle validee. Acces autorise.");
    } else {
        SetSt(L"Cle invalide. Genere-en une sur le site.",C_ERR);
        Log(L"  [!] Cle invalide.");
        EnableWindow(g_bValKey,TRUE);
    }
    g_validating=false;return 0;
}

static DWORD WINAPI LaunchThread(LPVOID){
    wchar_t pb[512]={};GetWindowText(g_ePath,pb,511);
    std::wstring dir=FindWin64(pb);
    EnableWindow(g_bLaunch,FALSE);SetSt(L"Demarrage...",C_ACCENT);
    struct{std::wstring exe,args;}procs[]={
        {L"FortniteLauncher.exe",L""},
        {L"FortniteClient-Win64-Shipping.exe",L"-epicapp=Fortnite -epicenv=Prod -epiclocale=fr -skippatchcheck -noeac -nobe -fromfl=be -fltoken=fn"}
    };
    for(auto& p:procs){Log(L"  >> "+p.exe);bool ok=Launch(dir,p.exe,p.args);Log(ok?L"  [OK]":L"  [Introuvable]");Sleep(1200);}
    SetSt(L"Fortnite Private demarre !",C_OK);EnableWindow(g_bLaunch,TRUE);return 0;
}

static void InitStars(){
    srand((unsigned)time(NULL));g_stars.clear();
    for(int i=0;i<120;i++){Star s;s.x=(float)(SIDE_W+rand()%(g_W-SIDE_W));s.y=(float)(rand()%g_H);s.r=.3f+(rand()%15)/10.f;s.a=(float)(rand()%100)/100.f;s.da=.002f+(rand()%6)/2000.f;if(rand()%2)s.da=-s.da;s.vx=((rand()%60)-30)/3000.f;s.vy=((rand()%60)-30)/3000.f;s.ct=rand()%3;g_stars.push_back(s);}
}
static void RR(HDC dc,int x,int y,int w,int h,int r,COLORREF fill,COLORREF brd,int bw=1){
    HBRUSH b=CreateSolidBrush(fill);HPEN p=CreatePen(PS_SOLID,bw,brd);
    HBRUSH ob=(HBRUSH)SelectObject(dc,b);HPEN op=(HPEN)SelectObject(dc,p);
    RoundRect(dc,x,y,x+w,y+h,r,r);SelectObject(dc,ob);SelectObject(dc,op);DeleteObject(b);DeleteObject(p);
}
// Bouton LAUNCH GAME cyan — très arrondi comme GLOW
static void CyanBtn(HDC dc,int x,int y,int w,int h,const wchar_t* txt,bool dis=false){
    int rad=h; // rayon = hauteur pour effet pill
    if(dis){RR(dc,x,y,w,h,rad,C_BG3,C_BORDER);SetBkMode(dc,TRANSPARENT);SetTextColor(dc,C_MUTED);SelectObject(dc,g_fNorm);RECT r={x,y,x+w,y+h};DrawText(dc,txt,-1,&r,DT_CENTER|DT_VCENTER|DT_SINGLELINE);return;}
    HRGN rgn=CreateRoundRectRgn(x,y,x+w,y+h,rad,rad);SelectClipRgn(dc,rgn);
    for(int i=0;i<h;i++){
        float t=(float)i/h;
        int ri=(int)(6+t*10),gi=(int)(182-t*20),bi=(int)(212-t*15);
        HPEN p=CreatePen(PS_SOLID,1,RGB(ri,gi,bi));HPEN op=(HPEN)SelectObject(dc,p);
        MoveToEx(dc,x,y+i,NULL);LineTo(dc,x+w,y+i);SelectObject(dc,op);DeleteObject(p);
    }
    SelectClipRgn(dc,NULL);DeleteObject(rgn);
    HPEN pn=CreatePen(PS_SOLID,1,C_CYAN2);HBRUSH nb=(HBRUSH)GetStockObject(NULL_BRUSH);SelectObject(dc,nb);SelectObject(dc,pn);RoundRect(dc,x,y,x+w,y+h,rad,rad);DeleteObject(pn);
    SetBkMode(dc,TRANSPARENT);SetTextColor(dc,RGB(5,10,20));SelectObject(dc,g_fBig);
    RECT r={x,y,x+w,y+h};DrawText(dc,txt,-1,&r,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
}
// Bouton secondaire arrondi
static void PurpleBtn(HDC dc,int x,int y,int w,int h,const wchar_t* txt,bool dis=false){
    int rad=h;
    if(dis){RR(dc,x,y,w,h,rad,C_BG3,C_BORDER);SetBkMode(dc,TRANSPARENT);SetTextColor(dc,C_MUTED);SelectObject(dc,g_fNorm);RECT r={x,y,x+w,y+h};DrawText(dc,txt,-1,&r,DT_CENTER|DT_VCENTER|DT_SINGLELINE);return;}
    HRGN rgn=CreateRoundRectRgn(x,y,x+w,y+h,rad,rad);SelectClipRgn(dc,rgn);
    for(int i=0;i<h;i++){
        float t=(float)i/h;
        HPEN p=CreatePen(PS_SOLID,1,RGB((int)(99+t*20),(int)(102+t*10),(int)(241-t*20)));
        HPEN op=(HPEN)SelectObject(dc,p);MoveToEx(dc,x,y+i,NULL);LineTo(dc,x+w,y+i);SelectObject(dc,op);DeleteObject(p);
    }
    SelectClipRgn(dc,NULL);DeleteObject(rgn);
    HPEN pn=CreatePen(PS_SOLID,1,C_ACCENT);HBRUSH nb=(HBRUSH)GetStockObject(NULL_BRUSH);SelectObject(dc,nb);SelectObject(dc,pn);RoundRect(dc,x,y,x+w,y+h,rad,rad);DeleteObject(pn);
    SetBkMode(dc,TRANSPARENT);SetTextColor(dc,RGB(255,255,255));SelectObject(dc,g_fBig);
    RECT r={x,y,x+w,y+h};DrawText(dc,txt,-1,&r,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
}
static bool PtIn(POINT p,RECT r){return p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom;}

struct NavItem{const wchar_t* label;int page;bool locked;};
static NavItem g_nav[]={
    {L"Cle d'acces",PAGE_KEY,  false},
    {L"Accueil",    PAGE_HOME,  true},
    {L"Parametres", PAGE_PARAMS,true},
    {L"Logs",       PAGE_LOGS,  true},
};
static const int NAV_N=4;

static void SetPage(int p){
    g_page=p;
    ShowWindow(g_eKey,   p==PAGE_KEY?SW_SHOW:SW_HIDE);
    ShowWindow(g_bValKey,p==PAGE_KEY?SW_SHOW:SW_HIDE);
    ShowWindow(g_bLaunch,p==PAGE_HOME?SW_SHOW:SW_HIDE);
    ShowWindow(g_ePath,  p==PAGE_PARAMS?SW_SHOW:SW_HIDE);
    ShowWindow(g_bBrowse,p==PAGE_PARAMS?SW_SHOW:SW_HIDE);
    ShowWindow(g_bSave,  p==PAGE_PARAMS?SW_SHOW:SW_HIDE);
    ShowWindow(g_eLogs,  p==PAGE_LOGS?SW_SHOW:SW_HIDE);
    InvalidateRect(g_wnd,NULL,FALSE);
}
static void UnlockNav(){for(int i=0;i<NAV_N;i++)g_nav[i].locked=false;InvalidateRect(g_wnd,NULL,FALSE);}

static LRESULT CALLBACK WndProc(HWND hw,UINT msg,WPARAM wp,LPARAM lp){
    switch(msg){
    case WM_CREATE:{
        g_wnd=hw;
        DWM_WINDOW_CORNER_PREFERENCE corner=DWMWCP_ROUND;DwmSetWindowAttribute(hw,33,&corner,sizeof(corner));
        g_fTitle=MkFont(20,FW_BLACK,L"Segoe UI");g_fBig=MkFont(13,FW_BOLD,L"Segoe UI");
        g_fNorm=MkFont(12,FW_NORMAL,L"Segoe UI");g_fSmall=MkFont(11,FW_NORMAL,L"Segoe UI");
        g_fMono=MkFont(12,FW_NORMAL,L"Consolas");g_brBg2=CreateSolidBrush(C_BG2);
        // Key input
        g_eKey=CreateWindowEx(WS_EX_CLIENTEDGE,L"EDIT",L"",WS_CHILD|ES_AUTOHSCROLL|ES_PASSWORD,SIDE_W+40,200,g_W-SIDE_W-80,40,hw,(HMENU)IDE_KEY,GetModuleHandle(NULL),NULL);
        SendMessage(g_eKey,WM_SETFONT,(WPARAM)g_fMono,TRUE);
        SendMessage(g_eKey,EM_SETPASSWORDCHAR,0,0); // affiche le texte
        SendMessage(g_eKey,EM_SETCUEBANNER,TRUE,(LPARAM)L"XXXX-XXXX-XXXX-XXXX");
        // Validate key button
        g_bValKey=CreateWindow(L"BUTTON",L"Valider la cle",WS_CHILD|WS_VISIBLE|BS_OWNERDRAW,SIDE_W+40,256,g_W-SIDE_W-80,44,hw,(HMENU)IDB_VALKEY,GetModuleHandle(NULL),NULL);
        // Launch button
        g_bLaunch=CreateWindow(L"BUTTON",L"LAUNCH GAME",WS_CHILD|BS_OWNERDRAW,SIDE_W+40,g_H-100,g_W-SIDE_W-80,50,hw,(HMENU)IDB_LAUNCH,GetModuleHandle(NULL),NULL);
        // Path
        g_ePath=CreateWindowEx(WS_EX_CLIENTEDGE,L"EDIT",L"",WS_CHILD|ES_AUTOHSCROLL,SIDE_W+40,160,g_W-SIDE_W-200,36,hw,(HMENU)IDE_PATH,GetModuleHandle(NULL),NULL);
        SendMessage(g_ePath,WM_SETFONT,(WPARAM)g_fNorm,TRUE);SendMessage(g_ePath,EM_SETCUEBANNER,TRUE,(LPARAM)L"C:\\Fortnite\\");
        g_bBrowse=CreateWindow(L"BUTTON",L"Parcourir",WS_CHILD|BS_OWNERDRAW,g_W-150,160,130,36,hw,(HMENU)IDB_BROWSE,GetModuleHandle(NULL),NULL);
        g_bSave=CreateWindow(L"BUTTON",L"Enregistrer",WS_CHILD|BS_OWNERDRAW,SIDE_W+40,g_H-100,g_W-SIDE_W-80,46,hw,(HMENU)IDB_SAVE,GetModuleHandle(NULL),NULL);
        // Logs
        g_eLogs=CreateWindowEx(WS_EX_CLIENTEDGE,L"EDIT",L"",WS_CHILD|WS_VSCROLL|ES_MULTILINE|ES_READONLY|ES_AUTOVSCROLL,SIDE_W+20,HEAD_H+10,g_W-SIDE_W-40,g_H-HEAD_H-60,hw,(HMENU)IDE_LOGS,GetModuleHandle(NULL),NULL);
        SendMessage(g_eLogs,WM_SETFONT,(WPARAM)g_fMono,TRUE);
        LoadCfg();
        // Si une key est sauvegardée, on la valide auto
        wchar_t k[256]={};GetWindowText(g_eKey,k,255);
        if(wcslen(k)>0){CreateThread(NULL,0,ValidateThread,NULL,0,NULL);}
        else{SetPage(PAGE_KEY);}
        InitStars();SetTimer(hw,IDT_ANIM,16,NULL);break;
    }
    case WM_SIZE:{
        g_W=LOWORD(lp);g_H=HIWORD(lp);
        if(g_eKey)   SetWindowPos(g_eKey,   NULL,SIDE_W+40,200,g_W-SIDE_W-80,40,SWP_NOZORDER);
        if(g_bValKey)SetWindowPos(g_bValKey,NULL,SIDE_W+40,256,g_W-SIDE_W-80,44,SWP_NOZORDER);
        if(g_bLaunch)SetWindowPos(g_bLaunch,NULL,SIDE_W+40,g_H-100,g_W-SIDE_W-80,50,SWP_NOZORDER);
        if(g_ePath)  SetWindowPos(g_ePath,  NULL,SIDE_W+40,160,g_W-SIDE_W-200,36,SWP_NOZORDER);
        if(g_bBrowse)SetWindowPos(g_bBrowse,NULL,g_W-150,160,130,36,SWP_NOZORDER);
        if(g_bSave)  SetWindowPos(g_bSave,  NULL,SIDE_W+40,g_H-100,g_W-SIDE_W-80,46,SWP_NOZORDER);
        if(g_eLogs)  SetWindowPos(g_eLogs,  NULL,SIDE_W+20,HEAD_H+10,g_W-SIDE_W-40,g_H-HEAD_H-60,SWP_NOZORDER);
        if(g_mdc){DeleteDC(g_mdc);g_mdc=NULL;}if(g_mbmp){DeleteObject(g_mbmp);g_mbmp=NULL;}break;
    }
    case WM_TIMER:{
        for(auto& s:g_stars){s.a+=s.da;if(s.a<=0||s.a>=1)s.da=-s.da;s.x+=s.vx;s.y+=s.vy;if(s.x<SIDE_W)s.x=(float)g_W;if(s.x>g_W)s.x=(float)SIDE_W;if(s.y<0)s.y=(float)g_H;if(s.y>g_H)s.y=0;}
        RECT zone={SIDE_W,HEAD_H,g_W,g_H};InvalidateRect(hw,&zone,FALSE);break;
    }
    case WM_LBUTTONDOWN:{
        POINT p={(short)LOWORD(lp),(short)HIWORD(lp)};
        if(p.y<HEAD_H&&p.x<g_W-90){g_drag=true;g_dragPt=p;SetCapture(hw);}
        if(p.x>=g_W-44&&p.x<=g_W-8&&p.y>=8&&p.y<=36)DestroyWindow(hw);
        if(p.x>=g_W-84&&p.x<=g_W-48&&p.y>=8&&p.y<=36)ShowWindow(hw,SW_MINIMIZE);
        for(int i=0;i<NAV_N;i++){int ny=HEAD_H+20+i*52;RECT nr={8,ny,SIDE_W-8,ny+42};if(PtIn(p,nr)&&!g_nav[i].locked)SetPage(g_nav[i].page);}
        break;
    }
    case WM_MOUSEMOVE:{
        POINT p={(short)LOWORD(lp),(short)HIWORD(lp)};
        if(g_drag){RECT wr;GetWindowRect(hw,&wr);SetWindowPos(hw,NULL,wr.left+p.x-g_dragPt.x,wr.top+p.y-g_dragPt.y,0,0,SWP_NOSIZE|SWP_NOZORDER);}
        int hn=-1;for(int i=0;i<NAV_N;i++){int ny=HEAD_H+20+i*52;RECT nr={8,ny,SIDE_W-8,ny+42};if(PtIn(p,nr))hn=i;}
        if(hn!=g_hoverNav){g_hoverNav=hn;RECT sr={0,0,SIDE_W,g_H};InvalidateRect(hw,&sr,FALSE);}break;
    }
    case WM_LBUTTONUP:if(g_drag){g_drag=false;ReleaseCapture();}break;
    case WM_DRAWITEM:{
        DRAWITEMSTRUCT* di=(DRAWITEMSTRUCT*)lp;wchar_t txt[128]={};GetWindowText(di->hwndItem,txt,127);
        bool dis=(di->itemState&ODS_DISABLED)!=0;
        RECT r=di->rcItem;int w=r.right-r.left,h=r.bottom-r.top;int id=GetDlgCtrlID(di->hwndItem);
        if(id==IDB_LAUNCH)CyanBtn(di->hDC,r.left,r.top,w,h,txt,dis);
        else PurpleBtn(di->hDC,r.left,r.top,w,h,txt,dis);return TRUE;
    }
    case WM_COMMAND:{
        int id=LOWORD(wp);
        if(id==IDB_VALKEY&&!g_validating){EnableWindow(g_bValKey,FALSE);CreateThread(NULL,0,ValidateThread,NULL,0,NULL);}
        if(id==IDB_LAUNCH&&g_verified){SetPage(PAGE_LOGS);Log(L"  == Demarrage ==");CreateThread(NULL,0,LaunchThread,NULL,0,NULL);}
        if(id==IDB_BROWSE){CoInitialize(NULL);wchar_t path[512]={};BROWSEINFOW bi={};bi.hwndOwner=hw;bi.pszDisplayName=path;bi.lpszTitle=L"Dossier Fortnite";bi.ulFlags=BIF_RETURNONLYFSDIRS|BIF_NEWDIALOGSTYLE;LPITEMIDLIST pidl=SHBrowseForFolderW(&bi);if(pidl){SHGetPathFromIDListW(pidl,path);SetWindowText(g_ePath,path);CoTaskMemFree(pidl);}CoUninitialize();}
        if(id==IDB_SAVE){SaveCfg();SetSt(L"Configuration enregistree !",C_OK);}break;
    }
    case WM_PAINT:{
        PAINTSTRUCT ps;HDC hdc=BeginPaint(hw,&ps);RECT rc;GetClientRect(hw,&rc);int W=rc.right,H=rc.bottom;
        if(!g_mdc){g_mdc=CreateCompatibleDC(hdc);g_mbmp=CreateCompatibleBitmap(hdc,W,H);SelectObject(g_mdc,g_mbmp);}
        HDC dc=g_mdc;
        HBRUSH bgb=CreateSolidBrush(C_BG);FillRect(dc,&rc,bgb);DeleteObject(bgb);
        // Glows
        {HPEN np=(HPEN)GetStockObject(NULL_PEN);SelectObject(dc,np);
        HBRUSH b1=CreateSolidBrush(RGB(18,16,42));Ellipse(dc,SIDE_W-60,-60,SIDE_W+260,260);DeleteObject(b1);
        HBRUSH b2=CreateSolidBrush(RGB(14,12,34));Ellipse(dc,SIDE_W-30,-30,SIDE_W+170,170);DeleteObject(b2);
        HBRUSH b3=CreateSolidBrush(RGB(8,20,30));Ellipse(dc,W-200,H-200,W+60,H+60);DeleteObject(b3);
        HBRUSH b4=CreateSolidBrush(RGB(8,16,26));Ellipse(dc,W-130,H-130,W+30,H+30);DeleteObject(b4);}
        // Stars
        {HPEN np=(HPEN)GetStockObject(NULL_PEN);SelectObject(dc,np);
        for(auto& s:g_stars){COLORREF col;if(s.ct==1)col=RGB((int)(70*s.a+15),(int)(50*s.a+20),255);else if(s.ct==2)col=RGB(0,(int)(180*s.a+20),(int)(220*s.a+20));else col=RGB((int)(180*s.a+30),(int)(180*s.a+30),(int)(200*s.a+30));HBRUSH b=CreateSolidBrush(col);SelectObject(dc,b);int x=(int)s.x,y=(int)s.y,r2=(int)(s.r+.5f);Ellipse(dc,x-r2,y-r2,x+r2+1,y+r2+1);DeleteObject(b);}}
        // Sidebar
        {HBRUSH sb=CreateSolidBrush(C_SIDE);RECT sr={0,0,SIDE_W,H};FillRect(dc,&sr,sb);DeleteObject(sb);
        HPEN sp=CreatePen(PS_SOLID,1,C_BORDER);HPEN op=(HPEN)SelectObject(dc,sp);MoveToEx(dc,SIDE_W,0,NULL);LineTo(dc,SIDE_W,H);SelectObject(dc,op);DeleteObject(sp);}
        // Logo
        SetBkMode(dc,TRANSPARENT);SelectObject(dc,g_fTitle);
        SetTextColor(dc,C_ACCENT);TextOut(dc,16,14,L"FN",2);SetTextColor(dc,C_TEXT);TextOut(dc,46,14,L"Private",7);
        // Nav items
        for(int i=0;i<NAV_N;i++){
            int ny=HEAD_H+20+i*52;bool act=(g_page==g_nav[i].page),lk=g_nav[i].locked,hov=(g_hoverNav==i&&!lk);
            HBRUSH nb=CreateSolidBrush(act?C_BG3:(hov?C_BG2:C_SIDE));RECT nr={8,ny,SIDE_W-8,ny+42};FillRect(dc,&nr,nb);DeleteObject(nb);
            if(act){HPEN ap=CreatePen(PS_SOLID,3,C_ACCENT);HPEN op=(HPEN)SelectObject(dc,ap);MoveToEx(dc,8,ny,NULL);LineTo(dc,8,ny+42);SelectObject(dc,op);DeleteObject(ap);}
            SelectObject(dc,g_fNorm);SetTextColor(dc,lk?C_BORDER:(act?C_TEXT:(hov?C_TEXT:C_MUTED)));
            RECT tr={20,ny,SIDE_W-8,ny+42};DrawText(dc,g_nav[i].label,-1,&tr,DT_LEFT|DT_VCENTER|DT_SINGLELINE);
        }
        // Header
        {HBRUSH hb=CreateSolidBrush(RGB(12,13,22));RECT hr={SIDE_W,0,W,HEAD_H};FillRect(dc,&hr,hb);DeleteObject(hb);
        HPEN hp=CreatePen(PS_SOLID,1,C_BORDER);HPEN op=(HPEN)SelectObject(dc,hp);MoveToEx(dc,SIDE_W,HEAD_H,NULL);LineTo(dc,W,HEAD_H);SelectObject(dc,op);DeleteObject(hp);}
        // Close/Min
        {RECT cr={W-44,8,W-8,36},mr={W-84,8,W-48,36};
        HBRUSH cb=CreateSolidBrush(C_BG3);FillRect(dc,&cr,cb);FillRect(dc,&mr,cb);DeleteObject(cb);
        SetBkMode(dc,TRANSPARENT);SelectObject(dc,g_fSmall);SetTextColor(dc,C_MUTED);
        DrawText(dc,L"x",-1,&cr,DT_CENTER|DT_VCENTER|DT_SINGLELINE);DrawText(dc,L"-",-1,&mr,DT_CENTER|DT_VCENTER|DT_SINGLELINE);}
        // Contenu
        SetBkMode(dc,TRANSPARENT);int cx=SIDE_W+30,cy=HEAD_H+20,cw=W-SIDE_W-60;
        if(g_page==PAGE_KEY){
            SelectObject(dc,g_fTitle);SetTextColor(dc,C_TEXT);TextOut(dc,cx,cy,L"Cle d'acces",11);
            SelectObject(dc,g_fNorm);SetTextColor(dc,C_MUTED);TextOut(dc,cx,cy+32,L"Entre ta cle generee sur le site pour acceder au launcher.",57);
            SelectObject(dc,g_fSmall);SetTextColor(dc,C_MUTED);TextOut(dc,cx,cy+160,L"Cle :",5);
            // Lien site
            SelectObject(dc,g_fSmall);SetTextColor(dc,C_CYAN);TextOut(dc,cx,cy+316,L"Genere ta cle sur : http://localhost:3000  (onglet Generateur)",61);
        }
        if(g_page==PAGE_HOME){
            // Welcome card style GLOW
            std::wstring welcome=L"Welcome back !";
            if(!g_username.empty()) welcome=L"Welcome back, "+g_username+L" !";
            SelectObject(dc,g_fTitle);SetTextColor(dc,C_CYAN);
            TextOut(dc,cx,cy,welcome.c_str(),(int)welcome.size());
            SelectObject(dc,g_fNorm);SetTextColor(dc,C_MUTED);
            TextOut(dc,cx,cy+36,L"FN Private Server — Fortnite Private",36);

            // Main card
            RECT card={cx,cy+80,cx+cw,cy+200};
            {HBRUSH cb=CreateSolidBrush(C_BG2);FillRect(dc,&card,cb);DeleteObject(cb);}
            {HPEN cp=CreatePen(PS_SOLID,1,C_BORDER);HPEN op=(HPEN)SelectObject(dc,cp);Rectangle(dc,card.left,card.top,card.right,card.bottom);SelectObject(dc,op);DeleteObject(cp);}
            // Tag badges
            {HBRUSH tb=CreateSolidBrush(RGB(30,40,70));RECT tr={cx+16,cy+96,cx+110,cy+116};FillRect(dc,&tr,tb);DeleteObject(tb);
            SelectObject(dc,g_fSmall);SetTextColor(dc,C_CYAN);TextOut(dc,cx+20,cy+98,L"CHAPTER 4",9);}
            {HBRUSH tb=CreateSolidBrush(RGB(30,40,70));RECT tr={cx+118,cy+96,cx+220,cy+116};FillRect(dc,&tr,tb);DeleteObject(tb);
            SelectObject(dc,g_fSmall);SetTextColor(dc,C_MUTED);TextOut(dc,cx+122,cy+98,L"FN PROJECT",10);}
            SelectObject(dc,g_fBig);SetTextColor(dc,C_CYAN);
            TextOut(dc,cx+16,cy+126,L"Play FN Private Today !",23);
            SelectObject(dc,g_fNorm);SetTextColor(dc,C_MUTED);
            TextOut(dc,cx+16,cy+150,L"Experience Fortnite Private With Custom Weapons, Map and More !",63);
            SelectObject(dc,g_fSmall);SetTextColor(dc,C_MUTED);
            TextOut(dc,cx+16,cy+174,L"Version v1.0  -  Configure le chemin dans Parametres",52);

            // 4 icone cards en bas style GLOW
            int cardW=(cw-30)/4, cardY=cy+220;
            struct{const wchar_t* icon;const wchar_t* title;const wchar_t* sub;}icons[]={
                {L"$",L"Donations",L"Support the project"},
                {L"@",L"Discord",L"Join our community"},
                {L"?",L"Support",L"Get help from team"},
                {L"*",L"Updates",L"Stay up to date"},
            };
            for(int i=0;i<4;i++){
                int ix=cx+i*(cardW+10);
                RECT ic={ix,cardY,ix+cardW,cardY+90};
                HBRUSH ib=CreateSolidBrush(C_BG2);FillRect(dc,&ic,ib);DeleteObject(ib);
                HPEN ip=CreatePen(PS_SOLID,1,C_BORDER);HPEN op=(HPEN)SelectObject(dc,ip);Rectangle(dc,ic.left,ic.top,ic.right,ic.bottom);SelectObject(dc,op);DeleteObject(ip);
                // Icone cercle
                HBRUSH cb=CreateSolidBrush(C_BG3);HPEN np=(HPEN)GetStockObject(NULL_PEN);SelectObject(dc,cb);SelectObject(dc,np);
                Ellipse(dc,ix+cardW/2-16,cardY+10,ix+cardW/2+16,cardY+42);DeleteObject(cb);
                SelectObject(dc,g_fBig);SetTextColor(dc,C_CYAN);
                RECT ir={ix,cardY+10,ix+cardW,cardY+42};DrawText(dc,icons[i].icon,-1,&ir,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
                SelectObject(dc,g_fSmall);SetTextColor(dc,C_TEXT);
                RECT tr={ix,cardY+48,ix+cardW,cardY+64};DrawText(dc,icons[i].title,-1,&tr,DT_CENTER|DT_SINGLELINE);
                SetTextColor(dc,C_MUTED);
                RECT sr={ix,cardY+64,ix+cardW,cardY+82};DrawText(dc,icons[i].sub,-1,&sr,DT_CENTER|DT_SINGLELINE);
            }
        }
        if(g_page==PAGE_PARAMS){
            SelectObject(dc,g_fTitle);SetTextColor(dc,C_TEXT);TextOut(dc,cx,cy,L"Parametres",10);
            SelectObject(dc,g_fNorm);SetTextColor(dc,C_MUTED);TextOut(dc,cx,cy+34,L"Dossier racine de Fortnite (contenant Engine ou FortniteGame)",61);
            HBRUSH cb=CreateSolidBrush(C_BG2);RECT card={cx,cy+90,cx+cw,cy+160};FillRect(dc,&card,cb);DeleteObject(cb);
            HPEN cp=CreatePen(PS_SOLID,1,C_BORDER);HPEN op=(HPEN)SelectObject(dc,cp);Rectangle(dc,card.left,card.top,card.right,card.bottom);SelectObject(dc,op);DeleteObject(cp);
            SelectObject(dc,g_fMono);SetTextColor(dc,C_CYAN);
            TextOut(dc,cx+16,cy+104,L"FortniteLauncher.exe",20);
            TextOut(dc,cx+16,cy+124,L"FortniteClient-Win64-Shipping.exe",33);
        }
        // Status bar
        {HBRUSH sb=CreateSolidBrush(RGB(12,13,22));RECT sr={SIDE_W,H-36,W,H};FillRect(dc,&sr,sb);DeleteObject(sb);
        HPEN sp=CreatePen(PS_SOLID,1,C_BORDER);HPEN op=(HPEN)SelectObject(dc,sp);MoveToEx(dc,SIDE_W,H-36,NULL);LineTo(dc,W,H-36);SelectObject(dc,op);DeleteObject(sp);
        SelectObject(dc,g_fSmall);SetTextColor(dc,g_statusCol);RECT sr2={SIDE_W+14,H-30,W-14,H};DrawText(dc,g_status.c_str(),-1,&sr2,DT_LEFT|DT_VCENTER|DT_SINGLELINE);}
        BitBlt(hdc,0,0,W,H,dc,0,0,SRCCOPY);EndPaint(hw,&ps);break;
    }
    case WM_CTLCOLOREDIT:{HDC h=(HDC)wp;SetBkColor(h,C_BG2);SetTextColor(h,C_TEXT);return(LRESULT)g_brBg2;}
    case WM_ERASEBKGND:return 1;
    case WM_DESTROY:KillTimer(hw,IDT_ANIM);PostQuitMessage(0);break;
    }
    return DefWindowProc(hw,msg,wp,lp);
}

int WINAPI WinMain(HINSTANCE hi,HINSTANCE,LPSTR,int ns){
    INITCOMMONCONTROLSEX ic={sizeof(ic),ICC_WIN95_CLASSES};InitCommonControlsEx(&ic);
    WNDCLASSEX wc={};wc.cbSize=sizeof(wc);wc.lpfnWndProc=WndProc;wc.hInstance=hi;
    wc.hbrBackground=(HBRUSH)GetStockObject(BLACK_BRUSH);wc.lpszClassName=L"FNL";
    wc.hCursor=LoadCursor(NULL,IDC_ARROW);wc.hIcon=LoadIcon(NULL,IDI_APPLICATION);
    RegisterClassEx(&wc);
    HWND hw=CreateWindowEx(WS_EX_APPWINDOW,L"FNL",L"FN Private Launcher",
        WS_POPUP|WS_VISIBLE,CW_USEDEFAULT,CW_USEDEFAULT,g_W,g_H,NULL,NULL,hi,NULL);
    int sw=GetSystemMetrics(SM_CXSCREEN),sh=GetSystemMetrics(SM_CYSCREEN);
    SetWindowPos(hw,NULL,(sw-g_W)/2,(sh-g_H)/2,g_W,g_H,SWP_NOZORDER);
    ShowWindow(hw,ns);UpdateWindow(hw);
    MSG msg;while(GetMessage(&msg,NULL,0,0)){TranslateMessage(&msg);DispatchMessage(&msg);}
    return (int)msg.wParam;
}
