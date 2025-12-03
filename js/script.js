let modo = "cadastro"; // estado inicial

// Recupera usuários do localStorage ou cria array vazio
let usuarios = JSON.parse(localStorage.getItem('flowpilotUsuarios')) || [];

// Elementos DOM
let form, camposCadastro, titulo, alternarBtn, submitBtn, mensagemDiv, confirmarSenhaContainer;

// Inicializar elementos DOM quando a página carregar
function inicializarElementos() {
    form = document.getElementById("form");
    camposCadastro = document.querySelectorAll(".campo-cadastro");
    titulo = document.getElementById("titulo-form");
    alternarBtn = document.getElementById("alternar");
    submitBtn = document.getElementById("submit-btn");
    mensagemDiv = document.getElementById("mensagem");
    confirmarSenhaContainer = document.getElementById("confirmar-senha-container");
}

// Alternar entre Cadastro e Login
function configurarAlternar() {
    if (!alternarBtn) return;
    
    alternarBtn.addEventListener("click", () => {
        alternarModo();
    });
}

// Função principal para alternar entre modos
function alternarModo() {
    // Garantir que temos referências atualizadas dos elementos
    inicializarElementos();
    
    if (modo === "cadastro") {
        // Mudar para Login
        camposCadastro.forEach(c => {
            if (c) {
                c.style.display = "none";
                // Marcar campos de cadastro como não obrigatórios temporariamente
                const input = c.querySelector('input');
                if (input) input.required = false;
            }
        });
        
        if (titulo) titulo.textContent = "Login";
        if (submitBtn) submitBtn.textContent = "Entrar";
        if (alternarBtn) alternarBtn.textContent = "Criar conta";
        
        // Se houver campo de confirmar senha, limpá-lo
        const confirmarSenhaInput = document.getElementById("confirmar-senha");
        if (confirmarSenhaInput) confirmarSenhaInput.value = "";
        
        modo = "login";
        
    } else {
        // Voltar para Cadastro
        camposCadastro.forEach(c => {
            if (c) {
                c.style.display = "block";
                // Restaurar obrigatoriedade dos campos
                const input = c.querySelector('input');
                if (input && input.id !== 'empresa') input.required = true;
            }
        });
        
        if (titulo) titulo.textContent = "Cadastro";
        if (submitBtn) submitBtn.textContent = "Cadastrar";
        if (alternarBtn) alternarBtn.textContent = "Já tenho conta";
        
        modo = "cadastro";
    }
    
    // Limpar mensagens
    if (mensagemDiv) {
        mostrarMensagem("", "info");
    }
    
    // Limpar qualquer erro de validação
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.setCustomValidity('');
    });
}

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = "info") {
    if (!mensagemDiv) return;
    
    mensagemDiv.textContent = texto;
    mensagemDiv.style.display = texto ? "block" : "none";
    
    // Resetar cores
    mensagemDiv.className = 'mensagem';
    
    if (tipo === "sucesso") {
        mensagemDiv.classList.add('mensagem-sucesso');
    } else if (tipo === "erro") {
        mensagemDiv.classList.add('mensagem-erro');
    } else if (tipo === "info") {
        mensagemDiv.classList.add('mensagem-info');
    }
}

// Função para validar email
function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Função para fazer cadastro
function cadastrarUsuario(dados) {
    // Verificar se email já existe
    const usuarioExistente = usuarios.find(u => u.email === dados.email);
    if (usuarioExistente) {
        mostrarMensagem("Este email já está cadastrado. Faça login ou use outro email.", "erro");
        return null;
    }
    
    // Criar ID único
    const id = Date.now();
    
    // Adicionar novo usuário
    const novoUsuario = {
        id: id,
        nome: dados.nome,
        email: dados.email,
        empresa: dados.empresa || "",
        senha: dados.senha,
        dataCadastro: new Date().toISOString()
    };
    
    usuarios.push(novoUsuario);
    
    // Salvar no localStorage
    localStorage.setItem('flowpilotUsuarios', JSON.stringify(usuarios));
    
    return novoUsuario;
}

// Função para fazer login automático após cadastro
function fazerLoginAutomatico(email, senha) {
    const usuario = usuarios.find(u => u.email === email && u.senha === senha);
    
    if (usuario) {
        // Salvar sessão do usuário
        localStorage.setItem('flowpilotUsuarioLogado', JSON.stringify({
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email
        }));
        
        return usuario;
    }
    
    return null;
}

// Função para verificar se há usuário logado
function verificarUsuarioLogado() {
    return JSON.parse(localStorage.getItem('flowpilotUsuarioLogado'));
}

// Configurar handler do formulário
function configurarFormulario() {
    if (!form) return;
    
    form.addEventListener("submit", function(e) {
        e.preventDefault();
        
        // Obter valores dos campos
        const nome = document.getElementById("nome")?.value || "";
        const email = document.getElementById("email")?.value || "";
        const empresa = document.getElementById("empresa")?.value || "";
        const senha = document.getElementById("senha")?.value || "";
        const confirmarSenha = document.getElementById("confirmar-senha")?.value || "";
        
        // Validações básicas
        if (!validarEmail(email)) {
            mostrarMensagem("Por favor, insira um email válido.", "erro");
            return;
        }
        
        if (senha.length < 6) {
            mostrarMensagem("A senha deve ter pelo menos 6 caracteres.", "erro");
            return;
        }
        
        if (modo === "cadastro") {
            // Validações específicas do cadastro
            if (!nome.trim()) {
                mostrarMensagem("Por favor, insira seu nome completo.", "erro");
                return;
            }
            
            if (senha !== confirmarSenha) {
                mostrarMensagem("As senhas não coincidem. Por favor, verifique.", "erro");
                return;
            }
            
            // Tentar cadastrar
            const novoUsuario = cadastrarUsuario({ nome, email, empresa, senha });
            
            if (novoUsuario) {
                mostrarMensagem("Cadastro realizado com sucesso! Fazendo login automático...", "sucesso");
                
                // Limpar formulário
                form.reset();
                
                // Fazer login automático após 1 segundo
                setTimeout(() => {
                    const usuarioLogado = fazerLoginAutomatico(email, senha);
                    
                    if (usuarioLogado) {
                        // Mostrar mensagem de login realizado
                        mostrarMensagem(`Login realizado com sucesso! Bem-vindo(a), ${usuarioLogado.nome}! Redirecionando...`, "sucesso");
                        
                        // Redirecionar para página principal após 2 segundos
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 2000);
                    }
                }, 1000);
            }
            
        } else {
            // Modo Login normal
            const usuario = usuarios.find(u => u.email === email && u.senha === senha);
            
            if (usuario) {
                // Salvar sessão do usuário
                localStorage.setItem('flowpilotUsuarioLogado', JSON.stringify({
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email
                }));
                
                mostrarMensagem(`Login realizado com sucesso! Bem-vindo(a), ${usuario.nome}!`, "sucesso");
                
                // Limpar formulário
                form.reset();
                
                // Redirecionar para página principal após 2 segundos
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                mostrarMensagem("Email ou senha incorretos. Tente novamente.", "erro");
            }
        }
    });
}

// Adicionar botão de logout em todas as páginas
function adicionarBotaoLogout() {
    const usuarioLogado = verificarUsuarioLogado();
    const header = document.querySelector('header');
    
    if (header && usuarioLogado && !header.querySelector('.logout-btn')) {
        // Remover botões de logout existentes
        const logoutBtnsExistentes = header.querySelectorAll('.logout-btn');
        logoutBtnsExistentes.forEach(btn => btn.remove());
        
        // Adicionar ao menu de navegação
        const navUl = header.querySelector('nav ul');
        if (navUl) {
            const logoutBtn = document.createElement('button');
            logoutBtn.textContent = `Sair (${usuarioLogado.nome})`;
            logoutBtn.className = 'logout-btn';
            
            logoutBtn.addEventListener('click', function() {
                localStorage.removeItem('flowpilotUsuarioLogado');
                window.location.reload();
            });
            
            const li = document.createElement('li');
            li.appendChild(logoutBtn);
            navUl.appendChild(li);
        }
    }
}

// Função para verificar e mostrar mensagem de login em todas as páginas
function verificarEmostrarMensagemLogin() {
    const usuarioLogado = verificarUsuarioLogado();
    const urlParams = new URLSearchParams(window.location.search);
    const loginSucesso = urlParams.get('login_sucesso');
    
    if (loginSucesso && usuarioLogado) {
        // Criar mensagem de sucesso
        criarMensagemGlobal(`✓ Login realizado com sucesso! Bem-vindo(a), ${usuarioLogado.nome}!`, 'sucesso');
        
        // Remover parâmetro da URL
        const novaURL = window.location.pathname;
        window.history.replaceState({}, document.title, novaURL);
    }
}

// Função para criar mensagem global em qualquer página
function criarMensagemGlobal(texto, tipo = 'info') {
    // Remover mensagens anteriores
    const mensagensAnteriores = document.querySelectorAll('.mensagem-global');
    mensagensAnteriores.forEach(msg => msg.remove());
    
    // Criar nova mensagem
    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = `mensagem-global mensagem-${tipo}`;
    mensagemDiv.textContent = texto;
    mensagemDiv.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        padding: 15px 30px;
        border-radius: 8px;
        font-weight: bold;
        text-align: center;
        animation: slideIn 0.5s ease-out;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 90%;
        width: auto;
    `;
    
    // Aplicar cores baseadas no tipo
    if (tipo === 'sucesso') {
        mensagemDiv.style.backgroundColor = '#d4edda';
        mensagemDiv.style.color = '#155724';
        mensagemDiv.style.border = '2px solid #c3e6cb';
    } else if (tipo === 'erro') {
        mensagemDiv.style.backgroundColor = '#f8d7da';
        mensagemDiv.style.color = '#721c24';
        mensagemDiv.style.border = '2px solid #f5c6cb';
    } else if (tipo === 'info') {
        mensagemDiv.style.backgroundColor = '#d1ecf1';
        mensagemDiv.style.color = '#0c5460';
        mensagemDiv.style.border = '2px solid #bee5eb';
    }
    
    // Adicionar botão de fechar
    const fecharBtn = document.createElement('button');
    fecharBtn.textContent = '×';
    fecharBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 10px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: inherit;
    `;
    fecharBtn.onclick = () => mensagemDiv.remove();
    mensagemDiv.appendChild(fecharBtn);
    
    // Adicionar ao body
    document.body.appendChild(mensagemDiv);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (mensagemDiv.parentNode) {
            mensagemDiv.style.animation = 'slideOut 0.5s ease-out';
            setTimeout(() => mensagemDiv.remove(), 500);
        }
    }, 5000);
}

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar elementos DOM
    inicializarElementos();
    
    // Configurar funcionalidades se estiver na página de contato
    if (window.location.pathname.includes('contato.html')) {
        configurarAlternar();
        configurarFormulario();
        
        // Verificar se usuário já está logado
        const usuarioLogado = verificarUsuarioLogado();
        if (usuarioLogado) {
            // Se já está logado, mudar para modo login e preencher email
            if (modo === "cadastro") {
                alternarModo();
            }
            if (document.getElementById("email")) {
                document.getElementById("email").value = usuarioLogado.email;
            }
        }
    }
    
    // Adicionar botão de logout em todas as páginas
    adicionarBotaoLogout();
    
    // Verificar e mostrar mensagem de login
    verificarEmostrarMensagemLogin();
});

// Adicionar animações CSS
if (!document.querySelector('#animacoes-css')) {
    const style = document.createElement('style');
    style.id = 'animacoes-css';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translate(-50%, -30px);
            }
            to {
                opacity: 1;
                transform: translate(-50%, 0);
            }
        }
        
        @keyframes slideOut {
            from {
                opacity: 1;
                transform: translate(-50%, 0);
            }
            to {
                opacity: 0;
                transform: translate(-50%, -30px);
            }
        }
    `;
    document.head.appendChild(style);
}

// Função para configurar o botão de jogar
function configurarBotaoJogar() {
  const btnJogar = document.getElementById('btn-jogar');
  
  if (btnJogar) {
      btnJogar.addEventListener('click', function() {
          // URL do jogo do itch.io
          const urlJogo = 'https://carolinebf.itch.io/flow-pilot-jogo-em-quiz';
          
          // Abrir em uma nova aba
          window.open(urlJogo, '_blank');
          
          // Ou redirecionar na mesma aba (descomente se preferir):
          // window.location.href = urlJogo;
      });
      
      // Adicionar estilo de hover específico para o botão de jogo
      btnJogar.style.cursor = 'pointer';
      btnJogar.style.transition = 'all 0.3s ease';
      
      btnJogar.addEventListener('mouseover', function() {
          this.style.transform = 'scale(1.05)';
          this.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
      });
      
      btnJogar.addEventListener('mouseout', function() {
          this.style.transform = 'scale(1)';
          this.style.boxShadow = '4px 4px 6px rgba(0,0,0,0.3)';
      });
  }
}

// Adicionar ao inicializador principal
document.addEventListener('DOMContentLoaded', function() {
  // ... seu código existente ...
  
  // Configurar botão de jogar
  configurarBotaoJogar();
});