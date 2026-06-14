<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinir Senha</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:480px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
            <div style="display:inline-block;width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#16a34a,#059669);margin-bottom:12px;"></div>
            <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">FlowinPay</h1>
        </div>

        <div style="background:#111827;border:1px solid #1e293b;border-radius:16px;padding:32px;">
            <h2 style="color:#fff;font-size:18px;font-weight:700;margin:0 0 12px;">Redefinir sua senha</h2>
            <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Você solicitou a redefinição de senha. Clique no botão abaixo para criar uma nova senha. Este link expira em 60 minutos.
            </p>

            <a href="{{ config('app.url') }}/reset-password?token={{ $token }}&email={{ urlencode($email) }}"
               style="display:block;text-align:center;background:linear-gradient(135deg,#16a34a,#059669);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:700;">
                Redefinir senha
            </a>

            <p style="color:#64748b;font-size:12px;line-height:1.5;margin:24px 0 0;">
                Se você não solicitou esta redefinição, ignore este email. Sua senha não será alterada.
            </p>
        </div>

        <p style="color:#475569;font-size:11px;text-align:center;margin:24px 0 0;">
            FlowinPay — Gateway de Pagamentos PIX<br>
            Este é um email automático, não responda.
        </p>
    </div>
</body>
</html>
