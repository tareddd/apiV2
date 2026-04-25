const fs = require('fs');

// Merge parts
const p1 = fs.readFileSync('part1.cpp','utf8');
const p2 = fs.readFileSync('part2.cpp','utf8');
const p3 = fs.readFileSync('part3.cpp','utf8');
fs.writeFileSync('FNLauncher.cpp', p1 + '\n' + p2 + '\n' + p3, 'utf8');
console.log('FNLauncher.cpp written: ' + (p1+p2+p3).split('\n').length + ' lines');
process.exit(0);

const code = `// FN Private Launcher
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

// Palette GLOW style
#define C_BG     RGB(15,17,26)
#define C_SIDE   RGB(20,22,35)
#define C_BG2    RGB(25,28,42)
#define C_BG3    RGB(30,33,50)
#define C_BORDER RGB(40,44,65)
#define C_ACCENT RGB(108,99,255)
#define C_CYAN   RGB(0,220,255)
#define C_TEXT   RGB(230,232,245)
#define C_MUTED  RGB(100,105,135)
#define C_OK     RGB(0,220,110)
#define C_ERR    RGB(255,70,85)
#define C_WARN   RGB(255,160,0)
#define SIDE_W   200
#define HEAD_H   48

// Pages
#define PAGE_KEY    0
#define PAGE_HOME   1
#define PAGE_PARAMS 2
#define PAGE_LOGS   3

// IDs
#define IDT_ANIM   1
#define IDB_LAUNCH 11
#define IDB_BROWSE 12
#define IDB_SAVE   13
#define IDB_VALKEY 14
#define IDE_KEY    20
#define IDE_PATH   21
#define IDE_LOGS   22

static const char* API_HOST = "localhost";
static const int   API_PORT = 3000;
static const wchar_t* CFG   = L"fnlauncher.cfg";

struct Star { float x,y,r,a,da,vx,vy; int ct; };

static HWND g_wnd, g_eKey, g_ePath, g_eLogs;
static HWND g_bLaunch, g_bBrowse, g_bSave, g_bValKey;
static HFONT g_fTitle, g_fBig, g_fNorm, g_fSmall, g_fMono;
static HBRUSH g_brBg2;
static int g_page=PAGE_KEY, g_W=960, g_H=580;
static std::wstring g_status=L"Entre ta cle pour acceder au launcher";
static COLORREF g_statusCol=C_MUTED;
static std::vector<Star> g_stars;
static HDC g_mdc=NULL; static HBITMAP g_mbmp=NULL;
static std::atomic<bool> g_verified(false);
static std::atomic<bool> g_validating(false);
static bool g_drag=false; static POINT g_dragPt={};
static int g_hoverNav=-1;
static std::wstring g_username=L"";

static HFONT MkFont(int sz,int w,const wchar_t* f){return CreateFont(sz,0,0,0,w,0,0,0,DEFAULT_CHARSET,0,0,CLEARTYPE_QUALITY,0,f);}
static void SetSt(const std::wstring& m,COLORREF c){g_status=m;g_statusCol=c;InvalidateRect(g_wnd,NULL,FALSE);}
static void Log(const std::wstring& l){int n=GetWindowTextLength(g_eLogs);SendMessage(g_eLogs,EM_SETSEL,n,n);SendMessage(g_eLogs,EM_REPLACESEL,FALSE,(LPARAM)(l+L"\\r\\n").c_str());}
static void SaveCfg(){wchar_t p[512]={},k[256]={};GetWindowText(g_ePath,p,511);GetWindowText(g_eKey,k,255);std::wofstream f(CFG);if(f.is_open())f<<p<<L"\\n"<<k<<L"\\n";}
static void LoadCfg(){std::wifstream f(CFG);if(!f.is_open())return;std::wstring p,k;std::getline(f,p);std::getline(f,k);if(!p.empty())SetWindowText(g_ePath,p.c_str());if(!k.empty())SetWindowText(g_eKey,k.c_str());}

static std::string HttpPost(const char* host,int port,const char* path,const char* body){
    HINTERNET hi=InternetOpenA("FNL",INTERNET_OPEN_TYPE_DIRECT,NULL,NULL,0);if(!hi)return"";
    HINTERNET hc=InternetConnectA(hi,host,port,NULL,NULL,INTERNET_SERVICE_HTTP,0,0);if(!hc){InternetCloseHandle(hi);return"";}
    const char* t[]={"application/json",NULL};
    HINTERNET hr=HttpOpenRequestA(hc,"POST",path,NULL,NULL,t,0,0);if(!hr){InternetCloseHandle(hc);InternetCloseHandle(hi);return"";}
    std::string hdr="Content-Type: application/json\\r\\n";
    HttpSendRequestA(hr,hdr.c_str(),(DWORD)hdr.size(),(LPVOID)body,(DWORD)strlen(body));
    char buf[2048]={};DWORD rd=0;std::string r;
    while(InternetReadFile(hr,buf,sizeof(buf)-1,&rd)&&rd>0){buf[rd]=0;r+=buf;rd=0;}
    InternetCloseHandle(hr);InternetCloseHandle(hc);InternetCloseHandle(hi);return r;
}
static std::string JsonVal(const std::string& j,const std::string& k){
    std::string kq="\\""+k+"\\": \\"";auto p=j.find(kq);
    if(p!=std::string::npos){p+=kq.size();auto e=j.find('"',p);return j.substr(p,e-p);}
    kq="\\""+k+"\\": ";p=j.find(kq);if(p==std::string::npos)return"";
    p+=kq.size();auto e=j.find_first_of(",}",p);return j.substr(p,e-p);
}
static std::wstring FindWin64(const std::wstring& base){
    std::wstring b=base;if(!b.empty()&&b.back()!=L'\\\\')b+=L'\\\\';
    std::vector<std::wstring> c={b,b+L"FortniteGame\\\\Binaries\\\\Win64\\\\",b+L"Engine\\\\Binaries\\\\Win64\\\\",b+L"Binaries\\\\Win64\\\\"};
    for(auto& x:c){std::wstring t=x+L"FortniteClient-Win64-Shipping.exe";if(GetFileAttributesW(t.c_str())!=INVALID_FILE_ATTRIBUTES)return x;}
    return b;
}
static bool Launch(const std::wstring& dir,const std::wstring& exe,const std::wstring& args=L""){
    std::wstring full=dir+exe;if(GetFileAttributesW(full.c_str())==INVALID_FILE_ATTRIBUTES)return false;
    std::wstring cmd=L"\\""+full+L"\\"";if(!args.empty())cmd+=L" "+args;
    STARTUPINFOW si={};si.cb=sizeof(si);PROCESS_INFORMATION pi={};
    BOOL r=CreateProcessW(full.c_str(),(LPWSTR)cmd.c_str(),NULL,NULL,FALSE,DETACHED_PROCESS,NULL,dir.c_str(),&si,&pi);
    if(r){CloseHandle(pi.hProcess);CloseHandle(pi.hThread);}return r==TRUE;
}
`;

fs.writeFileSync('FNLauncher.cpp', code, 'utf8');
console.log('Part 1 written: ' + code.length + ' chars');
