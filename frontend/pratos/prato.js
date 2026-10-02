const URL_API = 'http://localhost:3000';
const SILHUETA_URL = `${URL_API}/imagens/silhueta.png`;

let oQueEstaFazendo = '';
let prato = null;
bloquearAtributos(true);

async function inicializar() {
    await carregarUnidadesMedida();
    await listar();
}

async function carregarUnidadesMedida() {
    const select = document.getElementById("selectId_medida");
    try {
        const resposta = await fetch(`${URL_API}/medida/listar`);
        const data = await resposta.json();
        if (data.sucesso) {
            select.innerHTML = '<option value="">-- Selecione uma Unidade --</option>';
            data.unidades.forEach(um => {
                select.innerHTML += `<option value="${um.id_medida}">${um.id_medida} - ${um.nome_medida}</option>`;
            });
        }
    } catch (erro) {
        select.innerHTML = '<option value="">Erro ao carregar unidades</option>';
    }
}

function carregarImagem(id) {
    const img = document.getElementById('imgPrato');
    if (!id) {
        img.src = SILHUETA_URL;
        return;
    }
    img.src = `${URL_API}/imagens/${id}.png?t=${new Date().getTime()}`;
    img.onerror = () => { img.src = SILHUETA_URL; };
}

function acionarUpload() {
    if (oQueEstaFazendo !== 'inserindo' && oQueEstaFazendo !== 'alterando') {
        mostrarAviso("Clique em Inserir ou Alterar primeiro para poder escolher uma imagem.");
        return;
    }
    document.getElementById('inputImagem').click();
}

function previewImagem() {
    const inputFiles = document.getElementById('inputImagem').files;
    if (inputFiles.length > 0) {
        const url = URL.createObjectURL(inputFiles[0]);
        document.getElementById('imgPrato').src = url;
        mostrarAviso("Imagem escolhida! Clique em Salvar para concluir.");
    }
}

async function uploadImagemParaServidor(id) {
    const inputFiles = document.getElementById('inputImagem').files;
    if (inputFiles.length === 0) return;

    const formData = new FormData();
    formData.append('imagem', inputFiles[0]);

    try {
        await fetch(`${URL_API}/prato/upload/${id}`, {
            method: 'POST',
            body: formData
        });
    } catch (erro) {
        console.error("Erro ao enviar imagem:", erro);
    }
}

async function procurePorChavePrimaria(chave) {
    try {
        const resposta = await fetch(`${URL_API}/prato/${chave}`);
        const data = await resposta.json();
        return data.sucesso ? data.prato : null;
    } catch (erro) {
        return null;
    }
}

async function procure() {
    const id_prato = document.getElementById("inputId_prato").value;
    if (isNaN(id_prato) || !Number.isInteger(Number(id_prato)) || id_prato === "") {
        mostrarAviso("Precisa ser um número inteiro");
        return;
    }

    prato = await procurePorChavePrimaria(id_prato);
    oQueEstaFazendo = '';
    
    if (prato) {
        mostrarDadosPrato(prato);
        carregarImagem(id_prato);
        visibilidadeDosBotoes('inline', 'none', 'inline', 'inline', 'none');
        mostrarAviso("Achou no banco, pode alterar ou excluir");
    } else {
        limparAtributos();
        carregarImagem(null);
        visibilidadeDosBotoes('inline', 'inline', 'none', 'none', 'none');
        mostrarAviso("Não achou no banco, pode inserir");
    }
}

function inserir() {
    bloquearAtributos(false);
    visibilidadeDosBotoes('none', 'none', 'none', 'none', 'inline');
    oQueEstaFazendo = 'inserindo';
    mostrarAviso("INSERINDO - Digite os atributos, escolha a imagem e clique em salvar");
}

function alterar() {
    bloquearAtributos(false);
    visibilidadeDosBotoes('none', 'none', 'none', 'none', 'inline');
    oQueEstaFazendo = 'alterando';
    mostrarAviso("ALTERANDO - Digite os atributos, mude a imagem (opcional) e clique em salvar");
}

function excluir() {
    bloquearAtributos(true);
    visibilidadeDosBotoes('none', 'none', 'none', 'none', 'inline');
    oQueEstaFazendo = 'excluindo';
    mostrarAviso("EXCLUINDO - Clique em salvar para confirmar a exclusão");
}

async function salvar() {
    let id_prato = document.getElementById("inputId_prato").value;
    const nome_prato = document.getElementById("inputNome_prato").value;
    const id_medida = document.getElementById("selectId_medida").value || null;
    const quantidade_estoque_prato = parseInt(document.getElementById("inputQuantidade_estoque_prato").value) || 0;
    const preco_unitario_prato = parseFloat(document.getElementById("inputPreco_unitario_prato").value) || 0.0;

    const dadosPrato = { id_prato, nome_prato, id_medida, quantidade_estoque_prato, preco_unitario_prato };

    try {
        if (oQueEstaFazendo === 'inserindo') {
            await fetch(`${URL_API}/prato`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosPrato) });
            await uploadImagemParaServidor(id_prato);
            mostrarAviso("Inserido no Banco de Dados com sucesso!");
        } else if (oQueEstaFazendo === 'alterando') {
            await fetch(`${URL_API}/prato/${id_prato}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosPrato) });
            await uploadImagemParaServidor(id_prato);
            mostrarAviso("Alterado no Banco de Dados com sucesso!");
        } else if (oQueEstaFazendo === 'excluindo') {
            await fetch(`${URL_API}/prato/${id_prato}`, { method: 'DELETE' });
            carregarImagem(null);
            mostrarAviso("Excluído do Banco de Dados!");
        }

        visibilidadeDosBotoes('inline', 'none', 'none', 'none', 'none');
        limparAtributos();
        document.getElementById("inputId_prato").value = "";
        listar();
    } catch (erro) {
        mostrarAviso("Erro ao efetuar operação no servidor.");
    }
}

async function listar() {
    try {
        const resposta = await fetch(`${URL_API}/prato/listar`);
        const data = await resposta.json();
        if (data.sucesso) {
            let texto = "";
            for (let linha of data.pratos) {
                const um = linha.id_medida ? ` [${linha.id_medida}]` : '';
                texto += `${linha.id_prato} - ${linha.nome_prato}${um} - Estoque: ${linha.quantidade_estoque_prato} - Preço: R$ ${parseFloat(linha.preco_unitario_prato).toFixed(2)}<br>`;
            }
            document.getElementById("outputSaida").innerHTML = texto || "Nenhum prato cadastrado.";
        }
    } catch (erro) {
        document.getElementById("outputSaida").innerHTML = "Servidor offline.";
    }
}

function cancelarOperacao() {
    limparAtributos();
    carregarImagem(null);
    bloquearAtributos(true);
    visibilidadeDosBotoes('inline', 'none', 'none', 'none', 'none');
    mostrarAviso("Cancelou a operação");
}

function mostrarAviso(mensagem) {
    document.getElementById("divAviso").innerHTML = mensagem;
}

function mostrarDadosPrato(p) {
    document.getElementById("inputId_prato").value = p.id_prato;
    document.getElementById("inputNome_prato").value = p.nome_prato;
    document.getElementById("selectId_medida").value = p.id_medida || "";
    document.getElementById("inputQuantidade_estoque_prato").value = p.quantidade_estoque_prato;
    document.getElementById("inputPreco_unitario_prato").value = p.preco_unitario_prato;
    bloquearAtributos(true);
}

function limparAtributos() {
    prato = null;
    oQueEstaFazendo = '';
    document.getElementById("inputNome_prato").value = "";
    document.getElementById("selectId_medida").value = "";
    document.getElementById("inputQuantidade_estoque_prato").value = "";
    document.getElementById("inputPreco_unitario_prato").value = "";
    document.getElementById("inputImagem").value = "";
    bloquearAtributos(true);
}

function bloquearAtributos(soLeitura) {
    document.getElementById("inputId_prato").readOnly = !soLeitura;
    document.getElementById("inputNome_prato").readOnly = soLeitura;
    document.getElementById("selectId_medida").disabled = soLeitura;
    document.getElementById("inputQuantidade_estoque_prato").readOnly = soLeitura;
    document.getElementById("inputPreco_unitario_prato").readOnly = soLeitura;
}

function visibilidadeDosBotoes(btP, btI, btA, btE, btS) {
    document.getElementById("btProcure").style.display = btP;
    document.getElementById("btInserir").style.display = btI;
    document.getElementById("btAlterar").style.display = btA;
    document.getElementById("btExcluir").style.display = btE;
    document.getElementById("btSalvar").style.display = btS;
    document.getElementById("btCancelar").style.display = btS;
}