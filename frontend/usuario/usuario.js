const API_BASE_URL = 'http://localhost:3000';
let currentPersonId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('usuarioForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const usuariosTableBody = document.getElementById('usuariosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de usuarios e popular menu de categoria ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarUsuarios();
    popularCategoriasSelect();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarUsuario);
btnIncluir.addEventListener('click', incluirUsuario);
btnAlterar.addEventListener('click', alterarUsuario);
btnExcluir.addEventListener('click', excluirUsuario);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false);

function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquearPrimeiro) {
    const inputs = document.querySelectorAll('input, select, checkbox');
    inputs.forEach((input, index) => {
        if (index === 0) {
            input.disabled = bloquearPrimeiro;
        } else {
            input.disabled = !bloquearPrimeiro;
        }
    });
}

function limparFormulario() {
    form.reset();
    document.getElementById('checkboxFuncionario').checked = false;
    document.getElementById('salario_funcionario').value = '';
    document.getElementById('categoria_id_categoria').value = '';
    document.getElementById('porcentagem_comissao_funcionario').value = '';

    document.getElementById('checkboxCliente').checked = false;
    document.getElementById('renda_cliente').value = '';
    document.getElementById('data_cadastro_cliente').value = '';
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

function formatarData(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

function converterDataParaISO(dataString) {
    if (!dataString) return null;
    return new Date(dataString).toISOString();
}

function converterDataParaFormatoYYYYMMDD(isoDateString) {
    if (!isoDateString || typeof isoDateString !== 'string') {
        return '';
    }
    const partes = isoDateString.split('T');
    return partes.length > 0 ? partes[0] : '';
}

async function funcaoEhFuncionario(usuarioId) {
    try {
        const response = await fetch(`${API_BASE_URL}/funcionario/${usuarioId}`);
        const data = await response.json();

        if (response.ok && data.sucesso && data.funcionario) {
            return {
                ehFuncionario: true,
                salario_funcionario: data.funcionario.salario_funcionario,
                categoria_id_categoria: data.funcionario.categoria_id_categoria,
                porcentagem_comissao_funcionario: data.funcionario.porcentagem_comissao_funcionario
            };
        }
        return { ehFuncionario: false };
    } catch (error) {
        console.error('Erro ao verificar se é funcionario:', error);
        return { ehFuncionario: false };
    }
}

async function funcaoEhCliente(usuarioId) {
    try {
        const response = await fetch(`${API_BASE_URL}/cliente/${usuarioId}`);
        const data = await response.json();

        if (response.ok && (data.sucesso ? data.cliente : data)) {
            const clienteObj = data.cliente || data;
            return {
                ehCliente: true,
                renda_cliente: clienteObj.renda_cliente,
                data_cadastro_cliente: clienteObj.data_cadastro_cliente
            };
        }
        return { ehCliente: false };
    } catch (error) {
        console.error('Erro ao verificar se é cliente:', error);
        return { ehCliente: false };
    }
}

async function buscarUsuario() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um CPF para buscar', 'warning');
        return;
    }

    bloquearCampos(false);
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/usuario/${id}`);
        const data = await response.json();

        if (response.ok && data.sucesso) {
            preencherFormulario(data.usuario);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Usuario encontrada!', 'success');
        } else {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Usuario não encontrada. Você pode incluir uma nova usuario.', 'info');
            bloquearCampos(false);
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar usuario', 'error');
    }
}

async function preencherFormulario(usuario) {
    currentPersonId = usuario.cpf_usuario;
    searchId.value = usuario.cpf_usuario;
    document.getElementById('nome_usuario').value = usuario.nome_usuario || '';

    if (usuario.data_nascimento_usuario) {
        const data = new Date(usuario.data_nascimento_usuario);
        const dataFormatada = converterDataParaFormatoYYYYMMDD(data.toISOString());
        document.getElementById('data_nascimento').value = dataFormatada;
    } else {
        document.getElementById('data_nascimento').value = '';
    }
    document.getElementById('endereco_usuario').value = usuario.endereco_usuario || '';
    document.getElementById('senha_usuario').value = usuario.senha_usuario || '';
    document.getElementById('email_usuario').value = usuario.email_usuario || '';

    // Verifica funcionário
    const ehFunc = await funcaoEhFuncionario(currentPersonId);
    if (ehFunc.ehFuncionario) {
        document.getElementById('checkboxFuncionario').checked = true;
        document.getElementById('categoria_id_categoria').value = ehFunc.categoria_id_categoria;
        document.getElementById('salario_funcionario').value = ehFunc.salario_funcionario;
        document.getElementById('porcentagem_comissao_funcionario').value = ehFunc.porcentagem_comissao_funcionario;
    } else {
        document.getElementById('checkboxFuncionario').checked = false;
        document.getElementById('categoria_id_categoria').value = '';
        document.getElementById('salario_funcionario').value = '';
        document.getElementById('porcentagem_comissao_funcionario').value = '';
    }

    // Verifica cliente
    const ehCli = await funcaoEhCliente(currentPersonId);
    if (ehCli.ehCliente) {
        document.getElementById('checkboxCliente').checked = true;
        document.getElementById('renda_cliente').value = ehCli.renda_cliente;
        document.getElementById('data_cadastro_cliente').value = converterDataParaFormatoYYYYMMDD(ehCli.data_cadastro_cliente);
    } else {
        document.getElementById('checkboxCliente').checked = false;
        document.getElementById('renda_cliente').value = '';
        document.getElementById('data_cadastro_cliente').value = '';
    }
}

async function incluirUsuario() {
    mostrarMensagem('Digite os dados!', 'success');
    currentPersonId = searchId.value;
    limparFormulario();
    searchId.value = currentPersonId;
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_usuario').focus();
    operacao = 'incluir';
}

async function alterarUsuario() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_usuario').focus();
    operacao = 'alterar';
}

async function excluirUsuario() {
    mostrarMensagem('Excluindo usuario...', 'info');
    currentPersonId = searchId.value;
    searchId.disabled = true;
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

async function salvarOperacao() {
    const formData = new FormData(form);
    const usuario = {
        cpf_usuario: searchId.value.trim(),
        nome_usuario: formData.get('nome_usuario'),
        data_nascimento_usuario: converterDataParaISO(formData.get('data_nascimento')) || null,
        endereco_usuario: formData.get('endereco_usuario'),
        senha_usuario: formData.get('senha_usuario'),
        email_usuario: formData.get('email_usuario')
    };

    let funcionario = null;
    if (document.getElementById('checkboxFuncionario').checked) {
        funcionario = {
            usuario_cpf_usuario: usuario.cpf_usuario,
            salario_funcionario: document.getElementById('salario_funcionario').value,
            categoria_id_categoria: parseInt(document.getElementById('categoria_id_categoria').value, 10),
            porcentagem_comissao_funcionario: document.getElementById('porcentagem_comissao_funcionario').value
        };
    }
    const caminhoFunc = `${API_BASE_URL}/funcionario/${currentPersonId}`;

    let cliente = null;
    if (document.getElementById('checkboxCliente').checked) {
        cliente = {
            usuario_cpf_usuario: usuario.cpf_usuario,
            renda_cliente: document.getElementById('renda_cliente').value,
            data_cadastro_cliente: document.getElementById('data_cadastro_cliente').value || null
        };
    }
    const caminhoCliente = `${API_BASE_URL}/cliente/${currentPersonId}`;

    try {
        let respUsuario = null;
        switch (operacao) {
            case 'incluir':
                respUsuario = await fetch(`${API_BASE_URL}/usuario`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(usuario)
                });
                const dataUsuarioInc = await respUsuario.json();

                if (!dataUsuarioInc.sucesso) {
                    throw new Error('Erro ao criar usuario: ' + (dataUsuarioInc.mensagem || respUsuario.status));
                }

                if (funcionario) {
                    await fetch(`${API_BASE_URL}/funcionario`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(funcionario)
                    });
                }

                if (cliente) {
                    await fetch(`${API_BASE_URL}/cliente`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cliente)
                    });
                }

                mostrarMensagem('Usuario incluída com sucesso!', 'success');
                limparFormulario();
                carregarUsuarios();
                break;

            case 'alterar':
                respUsuario = await fetch(`${API_BASE_URL}/usuario/${currentPersonId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(usuario)
                });
                const dataUsuarioAlt = await respUsuario.json();
                if (!dataUsuarioAlt.sucesso) {
                    throw new Error('Erro ao alterar usuario: ' + (dataUsuarioAlt.mensagem || respUsuario.status));
                }

                // Trata Cliente
                if (document.getElementById('checkboxCliente').checked) {
                    const respVerifCli = await fetch(caminhoCliente);
                    if (respVerifCli.status === 404) {
                        await fetch(`${API_BASE_URL}/cliente`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(cliente)
                        });
                    } else {
                        await fetch(caminhoCliente, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(cliente)
                        });
                    }
                } else {
                    try {
                        const respCli = await fetch(caminhoCliente, { method: 'DELETE' });
                        const dataCli = await respCli.json().catch(() => ({}));
                        if (respCli.status === 409 || dataCli.sucesso === false) {
                            alert(dataCli.mensagem || 'Não foi possível remover o cliente');
                            document.getElementById('checkboxCliente').checked = true;
                        }
                    } catch (error) {
                        console.error('Erro ao excluir cliente:', error);
                    }
                }

                // Trata Funcionário
                if (document.getElementById('checkboxFuncionario').checked) {
                    const respVerifFunc = await fetch(caminhoFunc);
                    const dataVerifFunc = await respVerifFunc.json().catch(() => ({}));

                    if (respVerifFunc.status === 404 || !dataVerifFunc.sucesso) {
                        await fetch(`${API_BASE_URL}/funcionario`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(funcionario)
                        });
                    } else {
                        await fetch(caminhoFunc, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(funcionario)
                        });
                    }
                } else {
                    const respVerifFunc = await fetch(caminhoFunc);
                    const dataVerifFunc = await respVerifFunc.json().catch(() => ({}));
                    if (respVerifFunc.status === 200 && dataVerifFunc.sucesso) {
                        await fetch(caminhoFunc, { method: 'DELETE' });
                    }
                }

                mostrarMensagem('Usuario alterada com sucesso!', 'success');
                limparFormulario();
                carregarUsuarios();
                break;

            case 'excluir':
                const respCliDel = await fetch(caminhoCliente);
                if (respCliDel.status === 200) {
                    await fetch(caminhoCliente, { method: 'DELETE' });
                }

                const respFuncDel = await fetch(caminhoFunc);
                const dataFuncDel = await respFuncDel.json().catch(() => ({}));
                if (respFuncDel.status === 200 && dataFuncDel.sucesso) {
                    await fetch(caminhoFunc, { method: 'DELETE' });
                }

                const respDelUsuario = await fetch(`${API_BASE_URL}/usuario/${currentPersonId}`, { method: 'DELETE' });
                const dataDelUsuario = await respDelUsuario.json();

                if (!dataDelUsuario.sucesso) {
                    throw new Error('Erro ao excluir usuario: ' + (dataDelUsuario.mensagem || respDelUsuario.status));
                }

                mostrarMensagem('Usuario excluída com sucesso!', 'success');
                limparFormulario();
                carregarUsuarios();
                break;
        }
    } catch (error) {
        console.error('Erro salvarOperacao:', error);
        mostrarMensagem(error.message || 'Erro ao processar operação', 'error');
    } finally {
        mostrarBotoes(true, false, false, false, false, false);
        bloquearCampos(false);
        document.getElementById('searchId').focus();
    }
}

function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    document.getElementById('searchId').focus();
    mostrarMensagem('Operação cancelada', 'info');
}

async function carregarUsuarios() {
    try {
        const response = await fetch(`${API_BASE_URL}/usuario`);
        const data = await response.json();

        if (response.ok && data.sucesso) {
            renderizarTabelaUsuarios(data.usuarios);
        } else {
            throw new Error(data.mensagem || 'Erro ao carregar usuarios');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de usuarios', 'error');
    }
}

function renderizarTabelaUsuarios(usuarios) {
    usuariosTableBody.innerHTML = '';

    usuarios.forEach(usuario => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarUsuario(${usuario.cpf_usuario})">
                    ${usuario.cpf_usuario}
                </button>
            </td>
            <td>${usuario.nome_usuario}</td>
            <td>${formatarData(usuario.data_nascimento_usuario)}</td>                 
            <td>${usuario.endereco_usuario}</td>
            <td>${usuario.senha_usuario}</td>
            <td>${usuario.email_usuario}</td>
        `;
        usuariosTableBody.appendChild(row);
    });
}

async function selecionarUsuario(id) {
    searchId.value = id;
    await buscarUsuario();
}

// Busca os categoria no backend e preenche o select
async function popularCategoriasSelect() {
    const selectCategoria = document.getElementById('categoria_id_categoria');
    selectCategoria.innerHTML = '<option value="">Categoria</option>';

    try {
        const response = await fetch(`${API_BASE_URL}/categoria/listar`);
        const data = await response.json();

        if (data.sucesso && Array.isArray(data.categoria)) {
            data.categoria.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id_categoria;
                option.textContent = categoria.nome_categoria;
                selectCategoria.appendChild(option);
            });
        } else {
            console.error('Erro ao listar categoria:', data.mensagem);
        }
    } catch (error) {
        console.error('Falha ao popular o menu de categoria:', error);
        const optionErro = document.createElement('option');
        optionErro.textContent = 'Erro ao carregar categoria';
        optionErro.disabled = true;
        selectCategoria.appendChild(optionErro);
    }
}