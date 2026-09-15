# SoundBoard 🎵

Um simples programa desenvolvido com **vibe coding** que permite disparar músicas ou sons para o PC por meio de um celular ou tablet. Seu funcionamento é semelhante a uma mesa de som ou a um Steam Deck.

Basicamente, é uma alternativa simples para quem deseja enviar efeitos sonoros durante lives de gameplay ou qualquer tipo de reunião online.

## 🚀 Como Usar

### Passo 1 — Tenha o Python instalado

Certifique-se de que o **Python** está instalado em sua máquina.

### Passo 2 — Instale as dependências

Execute o arquivo `Instalar_Dependencias.bat`. Ele instalará automaticamente tudo o que é necessário para o programa funcionar.

### Passo 3 — Adicione seus sons

Coloque músicas, sons e efeitos sonoros na pasta `sounds`, que deve estar localizada na pasta do programa.

> Essa pasta conterá os sons que o programa irá disparar para o PC quando o botão correspondente for pressionado no tablet ou celular.

### Passo 4 — Inicie o servidor

Execute o arquivo `Iniciar_Servidor.bat`. Esse arquivo criará um servidor e fornecerá um **endereço de IP**.

Basta digitar esse IP em um navegador do tablet ou celular para acessar a tela onde aparecerão os botões referentes a cada música colocada na pasta `sounds`. Para executar o som no PC, basta pressionar o botão correspondente.

## ⚙️ Informações Extras

- O programa permite **configurar os botões** de cada som, atribuindo uma **cor** e uma **imagem**.
- É possível personalizar a interface conforme sua preferência.

## 💡 Dica

Use em conjunto com o programa **SteelSeries GG Sonar** para direcionar adequadamente onde os sons disparados devem sair.

## 📁 Estrutura do Projeto

```text
📦 soundboard
 ┣ 📂 sounds          # Pasta onde você coloca suas músicas e efeitos sonoros
 ┣ 📄 Instalar_Dependencias.bat
 ┣ 📄 Iniciar_Servidor.bat
 ┗ 📄 README.md
```

## 📝 Licença

Sinta-se livre para usar, modificar e compartilhar este projeto.
