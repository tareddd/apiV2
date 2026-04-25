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
            std::wstring welcome=L"Bienvenue !";
            if(!g_username.empty()) welcome=L"Bienvenue, "+g_username+L" !";
            SelectObject(dc,g_fTitle);SetTextColor(dc,C_CYAN);
            TextOut(dc,cx,cy,welcome.c_str(),(int)welcome.size());
            SelectObject(dc,g_fNorm);SetTextColor(dc,C_MUTED);
            TextOut(dc,cx,cy+34,L"FN Private Server — Fortnite Chapter 4",38);
            // Card launch
            HBRUSH cb=CreateSolidBrush(C_BG2);RECT card={cx,cy+80,cx+cw,cy+180};FillRect(dc,&card,cb);DeleteObject(cb);
            HPEN cp=CreatePen(PS_SOLID,1,C_BORDER);HPEN op=(HPEN)SelectObject(dc,cp);Rectangle(dc,card.left,card.top,card.right,card.bottom);SelectObject(dc,op);DeleteObject(cp);
            SelectObject(dc,g_fBig);SetTextColor(dc,C_ACCENT);TextOut(dc,cx+16,cy+96,L"FN PRIVATE",10);
            SelectObject(dc,g_fNorm);SetTextColor(dc,C_MUTED);TextOut(dc,cx+16,cy+120,L"Lance Fortnite Private Server",29);
            SelectObject(dc,g_fSmall);SetTextColor(dc,C_MUTED);TextOut(dc,cx+16,cy+148,L"Configure le chemin dans Parametres avant de lancer.",52);
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
