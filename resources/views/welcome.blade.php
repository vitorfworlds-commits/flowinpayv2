<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>FlowinPay</title>
    <meta name="theme-color" content="#10b981">
    <meta name="description" content="Gateway de pagamentos PIX">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="FlowinPay">
    <link rel="icon" type="image/png" href="/fav.png">
    <link rel="manifest" href="/manifest.json">
    <link rel="apple-touch-icon" href="/icons/icon-192.png">
    <script>
        (function() {
            var t = localStorage.getItem('fp_theme');
            if (t === 'light') {
                document.documentElement.classList.add('light');
            } else {
                document.documentElement.classList.add('dark');
            }
        })();
    </script>
    @vite(['resources/css/app.css', 'resources/js/App.tsx'])
</head>
<body>
    <div id="app"></div>
</body>
</html>
