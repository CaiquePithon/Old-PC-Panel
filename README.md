# MASTER SUITE — Painel Interativo de RPG

Painel em HTML, CSS e JavaScript para uso do mestre e consulta dos jogadores em uma campanha de RPG com estética inspirada em terminais de ficção científica. A interface utiliza fundo escuro, elementos verdes fluorescentes e efeitos visuais de monitor CRT.

## 1. Requisitos

- Navegador atualizado (Google Chrome, Microsoft Edge ou Firefox).
- O arquivo `painel_master_suite.html`.
- Não é necessário instalar dependências, servidor ou banco de dados para utilizar a versão local.

## 2. Como iniciar

1. Baixe ou mantenha `painel_master_suite.html` em uma pasta do computador.
2. Abra o arquivo com um navegador.
3. O sistema inicia diretamente no modo mestre.
4. Use os controles superiores e o painel lateral para organizar as páginas e editar o conteúdo.

> **Importante:** esta versão é local. O conteúdo fica salvo no armazenamento do navegador e não é sincronizado automaticamente com outros computadores ou com os navegadores dos jogadores.

## 3. Modos de utilização e atalhos

| Atalho | Ação |
|---|---|
| `Ctrl + J` | Alterna entre modo mestre e modo jogador. Ao entrar no modo jogador, exibe o terminal de inicialização antes do painel. |
| `Ctrl + D` | Desliga a interface. Pressionado novamente, liga o sistema e abre o terminal de inicialização seguido do modo jogador. |
| `Delete` / `Del` | Exclui a caixa selecionada no modo mestre. Se um elemento do mapa estiver selecionado, exclui somente esse elemento. Não atua enquanto o foco estiver em um campo de edição. |
| `Esc` | Fecha uma janela de confirmação aberta. |

O modo mestre apresenta os controles de edição. O modo jogador oculta esses controles e permite que os jogadores consultem e utilizem os componentes interativos disponíveis.

## 4. Páginas (abas)

- **`+ NOVA ABA`** cria uma página.
- **`− REMOVER ABA`** remove a página atual, mediante confirmação. O sistema impede a exclusão da última página.
- Para renomear uma aba, clique nela com o **botão direito do mouse** no modo mestre e edite o nome no campo exibido.
- Os nomes das páginas também são utilizados nas opções de navegação dos botões de comando.

## 5. Caixas e módulos

Use **`+ NOVA CAIXA`** para escolher o tipo de componente. Depois, selecione a caixa para abrir suas propriedades no painel lateral.

| Módulo | Utilização |
|---|---|
| Painel informativo | Exibir título e texto livre. |
| Botões de comando | Criar comandos clicáveis e configurar uma ou mais ações por botão. |
| Agenda / horários | Organizar períodos e seus respectivos dados. |
| Lista / objetivos | Criar itens que podem ser marcados durante a sessão. |
| Registro / terminal | Exibir registros e informações em formato de terminal. |
| Indicadores de status | Apresentar estados de sistemas ou recursos. |
| Tabela de dados | Organizar informações em linhas e colunas. |
| Mapa / setores | Criar uma planta com elementos gráficos e setores identificados. |

### Editar, mover e redimensionar caixas

- Selecione uma caixa para editar suas propriedades no inspetor lateral.
- Para mover uma caixa, dê dois cliques nela e arraste-a.
- Utilize a alça de redimensionamento quando disponível para ajustar largura e altura.
- Para editar textos diretamente, use **`EDITAR TEXTOS`** e dê dois cliques no texto desejado.
- Com uma caixa selecionada, pressione `Delete` ou `Del` para removê-la.

## 6. Mapa e setores

O módulo de mapa permite montar uma planta de forma livre com elementos como quadrados/retângulos, linhas e textos.

- Adicione elementos pelo editor do mapa.
- Selecione um elemento para acessar suas propriedades.
- Dê dois cliques no elemento e arraste para reposicioná-lo.
- Ajuste dimensões e demais propriedades disponíveis no editor.
- Pressione `Delete` ou `Del` para remover o elemento selecionado.
- Um setor pode receber o estado iluminado quando acionado por um botão de comando configurado para isso.

## 7. Botões de comando e ações combinadas

Cada botão pode combinar mais de uma ação. No editor da caixa **Botões de comando**, selecione as funções desejadas para cada comando:

- **Exibir mensagem:** mostra uma mensagem configurada.
- **Acender / apagar setor:** alterna a iluminação do setor escolhido em um mapa da página atual.
- **Alternar verde do botão:** alterna o destaque visual verde do próprio botão.
- **Abrir outra aba:** navega para a página selecionada.

Também é possível configurar o texto do botão, o destaque/estado inicial, a mensagem, a aba de destino, o mapa e o setor de destino, conforme a ação escolhida.

Os comandos podem ser clicados no **modo mestre** para testar suas ações antes de apresentar o painel aos jogadores. O comportamento e os efeitos também ficam disponíveis no modo jogador.

## 8. Terminal de inicialização

O terminal aparece ao entrar no modo jogador, não na abertura normal do modo mestre.

No inspetor, abra **`TERMINAL DE INICIALIZAÇÃO`** para editar:

- Identificação exibida no topo do terminal.
- Linhas apresentadas durante a inicialização (uma linha por entrada).

Use **`RESTAURAR TEXTO PADRÃO`** para recuperar as mensagens originais.

## 9. Salvar, exportar e importar

- As alterações são gravadas automaticamente no armazenamento local do navegador utilizado.
- **`EXPORTAR`** baixa um arquivo `backup-master-suite.json` com os dados do painel.
- **`IMPORTAR`** permite selecionar um backup JSON previamente exportado e restaurar seu conteúdo.
- **`RESETAR`** restaura a configuração inicial do painel, mediante confirmação.

### Recomendações de backup

Exporte um backup antes de fazer alterações grandes ou resetar o painel. Guarde cópias em outro local. Limpar os dados do navegador, trocar de navegador ou utilizar outro computador pode fazer com que a versão local não encontre os dados salvos anteriormente; nesse caso, importe o backup correspondente.

## 10. Limitações da versão local

- Não há contas de usuário, autenticação ou permissões individuais.
- Não há sincronização em tempo real entre mestre e jogadores em dispositivos diferentes.
- Para compartilhar o mesmo painel pela internet, será necessário hospedar a aplicação e implementar armazenamento/sincronização compartilhados.
- O salvamento automático depende de o navegador permitir armazenamento local para o arquivo.

## 11. Solução de problemas

**O painel voltou ao conteúdo inicial:** verifique se está usando o mesmo navegador e perfil. Se houver um backup, utilize **`IMPORTAR`**.

**As alterações não aparecem em outro computador:** isso é esperado na versão local; os dados não são sincronizados entre dispositivos. Exporte e importe um backup para transferir a configuração.

**O atalho não funciona:** clique primeiro na área principal do painel e confirme que a tecla `Ctrl` não está sendo interceptada pelo navegador ou por outro programa. Evite pressionar os atalhos enquanto digita em um campo.

**Uma ação de setor não funciona:** confira se o botão está configurado com a ação de setor, se o mapa foi selecionado e se o setor de destino foi escolhido corretamente.

---

**Projeto:** MASTER SUITE  
**Arquivo principal:** `painel_master_suite.html`  
**Formato:** aplicação web local (HTML/CSS/JavaScript)  
**Idioma da interface:** português, com rótulos de terminal em inglês quando aplicável.
