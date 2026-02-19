
# 🚀 Publicando o App Colégio Flama

Este projeto está pronto para ser publicado como um PWA (Progressive Web App) e convertido em APK.

## 1. Hospedagem Web (Onde o app vai morar)
Para que o APK e o PWA funcionem, os arquivos precisam estar online. Recomendamos:

### Opção A: Vercel (Mais fácil)
1. Crie uma conta em `vercel.com`.
2. Conecte seu repositório ou use o CLI: `npm i -g vercel && vercel`.
3. O app estará online em segundos com SSL automático.

### Opção B: Firebase Hosting (Mais robusto)
1. Crie um projeto no Console do Firebase.
2. Execute:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   firebase deploy
   ```

## 2. Gerando o APK (Android)
Após o site estar online (ex: `https://flama-app.web.app`):
1. Acesse o **PWABuilder.com**.
2. Digite a URL do seu site.
3. Clique em **Build My App** -> **Android**.
4. Siga as instruções para gerar o arquivo `.apk` ou `.aab` (para Play Store).

## 3. Instalando no Windows
1. Acesse o site pelo Microsoft Edge ou Chrome.
2. Clique no ícone de "Instalar App" na barra de endereços.
