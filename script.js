const inputCep = document.getElementById('inputCep');
const btnBuscar = document.getElementById('btnBuscar');
const divResultado = document.getElementById('resultado');
const resultadoWrapper = document.getElementById('resultadoWrapper');

async function consultarAPI() {
  const cep = inputCep.value.replace(/\D/g, '');

  if (cep.length !== 8) {
    mostrarResultado('<p class="erro-texto">CEP inválido! Digite 8 números.</p>');
    return;
  }

  btnBuscar.textContent = 'Buscando...';
  mostrarResultado('<p>Consultando o correio capivara...</p>');

  try {
    const url = `https://viacep.com.br/ws/${cep}/json/`;
    const resposta = await fetch(url);
    const dados = await resposta.json();

    if (dados.erro) {
      mostrarResultado('<p class="erro-texto">CEP não encontrado!</p>');
    } else {
      // Busca a foto + um resumo curto da cidade
      const infoCidade = await buscarInfoCidade(dados.localidade, dados.uf);

      mostrarResultado(`
        <div class="resultado-cidade">
          ${infoCidade.foto
            ? `<img src="${infoCidade.foto}" alt="${dados.localidade}" class="cidade-img">`
            : ''}
          <div class="info-texto">
            <p><strong>${dados.logradouro}</strong></p>
            <p>${dados.bairro}</p>
            <p>${dados.localidade} - ${dados.uf}</p>
            ${infoCidade.resumo
              ? `<p class="cidade-resumo">${infoCidade.resumo}</p>`
              : ''}
          </div>
        </div>
      `);
    }

  } catch (erro) {
    console.error(erro);
    mostrarResultado('<p class="erro-texto">Erro na conexão!</p>');
  } finally {
    btnBuscar.textContent = 'Buscar CEP';
  }
}

// Mostra o card de resultado e injeta o conteúdo dentro dele
function mostrarResultado(html) {
  divResultado.innerHTML = html;
  resultadoWrapper.style.display = 'block';
}

// Busca foto + resumo curto da cidade na Wikipédia
// Agora usa "search" para achar o artigo certo, mesmo que o nome
// não seja idêntico ao retornado pelo ViaCEP
async function buscarInfoCidade(cidade, uf) {
  try {
    // 1. Busca o artigo mais relevante (em vez de bater título exato)
    const termoBusca = encodeURIComponent(`${cidade} ${uf}`);
    const resBusca = await fetch(
      `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${termoBusca}&format=json&origin=*`
    );
    const dataBusca = await resBusca.json();
    const tituloEncontrado = dataBusca?.query?.search?.[0]?.title;

    if (!tituloEncontrado) {
      return { foto: null, resumo: null };
    }

    // 2. Usa o título encontrado para buscar foto + resumo
    const termo = encodeURIComponent(tituloEncontrado);
    const res = await fetch(
      `https://pt.wikipedia.org/w/api.php?action=query&titles=${termo}&prop=pageimages|extracts&exintro=true&explaintext=true&exsentences=2&format=json&pithumbsize=400&origin=*`
    );
    const data = await res.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const pagina = pages[pageId];

    return {
      foto: pagina?.thumbnail?.source || null,
      resumo: pagina?.extract || null
    };
  } catch {
    return { foto: null, resumo: null };
  }
}

btnBuscar.addEventListener('click', consultarAPI);

inputCep.addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter') {
    consultarAPI();
  }
});