/* ============================================================
   FOVA · CRM — Configuração da colaboração em tempo real
   ------------------------------------------------------------
   Preencha os DOIS valores abaixo com os dados do seu projeto no
   Supabase (Project Settings → API). Os dois são PÚBLICOS por
   natureza (a "anon key" é feita pra rodar no navegador e a
   segurança real vem das regras de RLS no banco), então podem ir
   pro deploy sem problema.

   · Enquanto estiverem vazios, o CRM funciona EXATAMENTE como antes
     (senha compartilhada + dados só neste aparelho). Nada quebra.
   · Assim que você colar URL + chave e rodar `node painel-ajfqcxvp4y/
     build-panel.mjs`, o login por sócio e a colaboração ao vivo ligam.
   ============================================================ */
window.FOVA_CFG = {
  supabaseUrl: 'https://arxtutjdxxkoelxkxpuu.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyeHR1dGpkeHhrb2VseGt4cHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MjY0MjgsImV4cCI6MjEwODIwMjQyOH0.G19eh_enQ3lVdAYDdKQDxCwfokMiSB9ttqO_KgaxI9M',

  // Opcional: liga logs de diagnóstico no console do navegador.
  debug: false,
};
