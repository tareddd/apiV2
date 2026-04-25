const fs = require('fs');
const c = fs.readFileSync('FNLauncher.cpp', 'utf8');
const marker = 'return (int)msg.wParam;\n}';
const idx = c.indexOf(marker);
if (idx > -1) {
    fs.writeFileSync('FNLauncher.cpp', c.substring(0, idx + marker.length) + '\n');
    console.log('OK - lignes gardees: ' + c.substring(0, idx).split('\n').length);
} else {
    console.log('Marker non trouve, essai avec \\r\\n...');
    const marker2 = 'return (int)msg.wParam;\r\n}';
    const idx2 = c.indexOf(marker2);
    if (idx2 > -1) {
        fs.writeFileSync('FNLauncher.cpp', c.substring(0, idx2 + marker2.length) + '\n');
        console.log('OK avec CRLF');
    } else {
        console.log('ECHEC - cherche WinMain...');
        const lines = c.split('\n');
        let lastWinMain = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('int WINAPI WinMain')) lastWinMain = i;
        }
        console.log('Dernier WinMain ligne: ' + lastWinMain);
        // Garde seulement jusqu'au premier WinMain + ~12 lignes
        const keep = lines.slice(0, lastWinMain + 12).join('\n');
        fs.writeFileSync('FNLauncher.cpp', keep + '\n');
        console.log('Fichier tronque a ' + (lastWinMain + 12) + ' lignes');
    }
}
