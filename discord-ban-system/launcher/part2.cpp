static void InitStars(){
    srand((unsigned)time(NULL));g_stars.clear();
    for(int i=0;i<120;i++){Star s;s.x=(float)(SIDE_W+rand()%(g_W-SIDE_W));s.y=(float)(rand()%g_H);s.r=.3f+(rand()%15)/10.f;s.a=(float)(rand()%100)/100.f;s.da=.002f+(rand()%6)/2000.f;if(rand()%2)s.da=-s.da;s.vx=((rand()%60)-30)/3000.f;s.vy=((rand()%60)-30)/3000.f;s.ct=rand()%3;g_stars.push_back(s);}
}
static void RR(HDC dc,int x,int y,int w,int h,int r,COLORREF fill,COLORREF brd,int bw=1){
    HBRUSH b=CreateSolidBrush(fill);HPEN p=CreatePen(PS_SOLID,bw,brd);
    HBRUSH ob=(HBRUSH)SelectObject(dc,b);HPEN op=(HPEN)SelectObject(dc,p);
    RoundRect(dc,x,y,x+w,y+h,r,r);SelectObject(dc,ob);SelectObject(dc,op);DeleteObject(b);DeleteObject(p);
}
static void CyanBtn(HDC dc,int x,int y,int w,int h,const wchar_t* txt,bool dis=false){
    if(dis){RR(dc,x,y,w,h,10,C_BG3,C_BORDER);SetBkMode(dc,TRANSPARENT);SetTextColor(dc,C_MUTED);SelectObject(dc,g_fNorm);RECT r={x,y,x+w,y+h};DrawText(dc,txt,-1,&r,DT_CENTER|DT_VCENTER|DT_SINGLELINE);return;}
    HRGN rgn=CreateRoundRectRgn(x,y,x+w,y+h,10,10);SelectClipRgn(dc,rgn);
    for(int i=0;i<h;i++){float t=(float)i/h;HPEN p=CreatePen(PS_SOLID,1,RGB((int)(t*20),(int)(200-t*30),(int)(255-t*20)));HPEN op=(HPEN)SelectObject(dc,p);MoveToEx(dc,x,y+i,NULL);LineTo(dc,x+w,y+i);SelectObject(dc,op);DeleteObject(p);}
    SelectClipRgn(dc,NULL);DeleteObject(rgn);
    HPEN pn=CreatePen(PS_SOLID,1,C_CYAN);HBRUSH nb=(HBRUSH)GetStockObject(NULL_BRUSH);SelectObject(dc,nb);SelectObject(dc,pn);RoundRect(dc,x,y,x+w,y+h,10,10);DeleteObject(pn);
    SetBkMode(dc,TRANSPARENT);SetTextColor(dc,RGB(5,5,15));SelectObject(dc,g_fBig);RECT r={x,y,x+w,y+h};DrawText(dc,txt,-1,&r,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
}
static void PurpleBtn(HDC dc,int x,int y,int w,int h,const wchar_t* txt,bool dis=false){
    if(dis){RR(dc,x,y,w,h,10,C_BG3,C_BORDER);SetBkMode(dc,TRANSPARENT);SetTextColor(dc,C_MUTED);SelectObject(dc,g_fNorm);RECT r={x,y,x+w,y+h};DrawText(dc,txt,-1,&r,DT_CENTER|DT_VCENTER|DT_SINGLELINE);return;}
    HRGN rgn=CreateRoundRectRgn(x,y,x+w,y+h,10,10);SelectClipRgn(dc,rgn);
    for(int i=0;i<h;i++){float t=(float)i/h;HPEN p=CreatePen(PS_SOLID,1,RGB((int)(108+t*31),(int)(99-t*7),255));HPEN op=(HPEN)SelectObject(dc,p);MoveToEx(dc,x,y+i,NULL);LineTo(dc,x+w,y+i);SelectObject(dc,op);DeleteObject(p);}
    SelectClipRgn(dc,NULL);DeleteObject(rgn);
    HPEN pn=CreatePen(PS_SOLID,1,C_ACCENT);HBRUSH nb=(HBRUSH)GetStockObject(NULL_BRUSH);SelectObject(dc,nb);SelectObject(dc,pn);RoundRect(dc,x,y,x+w,y+h,10,10);DeleteObject(pn);
    SetBkMode(dc,TRANSPARENT);SetTextColor(dc,RGB(255,255,255));SelectObject(dc,g_fBig);RECT r={x,y,x+w,y+h};DrawText(dc,txt,-1,&r,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
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
