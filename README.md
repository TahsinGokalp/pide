# Çörek Otu Yazı

Pidenin üstüne çörek otuyla yazı yazan web uygulaması. Tamamen statik (HTML + CSS + JS), derleme adımı yok, sunucu gerektirmez.

## Özellikler

- Yazıyı çörek otu tanelerine dönüştürür (çok satır destekli, Türkçe karakterler tamam)
- 5 yazı tipi, 3 pide şekli (oval, yuvarlak, uzun)
- Tane sıklığı, tane boyutu, yazı boyutu ayarları
- Sadece kenar çizgisi, kenara çerçeve, kafes deseni, susam serpme
- Serpme animasyonu
- PNG indirme, paylaşma (mobilde resmi doğrudan paylaşır, masaüstünde bağlantıyı kopyalar)
- Yazı, yazı tipi ve şekil adres çubuğunda saklanır; bağlantıyı açan aynı pideyi görür

## Yerelde çalıştırma

```bash
python3 -m http.server 8765
```

Sonra tarayıcıda `http://localhost:8765` aç.

## Yayınlama

### GitHub Pages

1. GitHub'da yeni bir repo aç (ör. `corek`).
2. Bu klasörü yükle:
   ```bash
   git init && git add . && git commit -m "ilk sürüm"
   git branch -M main
   git remote add origin https://github.com/KULLANICI/corek.git
   git push -u origin main
   ```
3. Repo → **Settings → Pages** → Source: **Deploy from a branch**, Branch: `main` / `/ (root)` → Save.
4. Bir iki dakika sonra `https://KULLANICI.github.io/corek/` adresinde yayında.

### Cloudflare Pages

1. Cloudflare panelinde **Workers & Pages → Create → Pages**.
2. Ya GitHub reposunu bağla (Framework: *None*, Build command: boş, Output directory: `/`), ya da **Upload assets** ile bu klasörü sürükle bırak.
3. `https://corek.pages.dev` gibi bir adreste yayında; istersen kendi alan adını bağlayabilirsin.

İkisi de ücretsiz.
