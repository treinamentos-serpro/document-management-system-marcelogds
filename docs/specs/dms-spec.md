# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web que permita ao usuário enviar, listar e baixar documentos, mantendo os arquivos no filesystem local e seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Enviar um arquivo por requisição e armazená-lo localmente com Multer `diskStorage`.
- Registrar e listar metadados de documentos em memória durante a execução do backend.
- Baixar um documento pelo identificador, sem expor seu caminho físico.
- Associar os documentos a um owner padrão configurável nesta fase, sem autenticação.
- Disponibilizar uma interface React para upload, listagem e download, integrada ao backend por `fetch`.
- Configurar porta, diretório de armazenamento, limite de upload e owner padrão por variáveis de ambiente.

### Fora do escopo

- Armazenamento externo ou em nuvem.
- Persistência durável dos metadados, banco de dados ou recuperação do catálogo após reinício.
- Autenticação, autorização, contas ou isolamento entre usuários autenticados.
- Versionamento, edição, visualização, busca, compartilhamento ou exclusão de documentos.
- Paginação da listagem e restrição de tipos de arquivo.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um documento. | Uma requisição multipart com um campo `file` válido grava o binário localmente e retorna os metadados criados. |
| RF-02 | O sistema limita o tamanho do upload. | Arquivos acima do limite configurado são rejeitados com HTTP 413 e não ficam disponíveis no catálogo. |
| RF-03 | O sistema registra metadados para cada upload aceito. | Cada upload recebe um identificador único, data/hora, nome original, tamanho e owner padrão. Uploads de conteúdo idêntico são documentos distintos. |
| RF-04 | O usuário pode listar documentos. | A resposta contém todos os metadados conhecidos pelo processo, sem incluir caminho físico nem nome interno de armazenamento. |
| RF-05 | O usuário pode baixar um documento por identificador. | Um identificador existente retorna o conteúdo como anexo; um identificador inexistente retorna HTTP 404. |
| RF-06 | O sistema comunica erros de entrada e operação. | Erros HTTP retornam JSON com código e mensagem compreensível, sem stack trace ou caminho local. |
| RF-07 | A interface oferece as operações do MVP. | O usuário consegue selecionar e enviar um arquivo, consultar a lista atualizada e iniciar o download de um item. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os binários devem ser gravados exclusivamente no filesystem local da aplicação, em `backend/storage` por padrão, usando Multer com `diskStorage`. Não usar provedores externos. |
| RNF-02 | Os metadados devem ser mantidos em memória nesta fase. O catálogo é volátil e pode ser perdido quando o processo reinicia; a solução não deve apresentar essa persistência como durável. |
| RNF-03 | A configuração operacional deve vir de variáveis de ambiente, com defaults locais documentados. |
| RNF-04 | O tamanho máximo padrão é 10 MiB (10.485.760 bytes), configurável. Qualquer tipo de arquivo é aceito; o MIME declarado pelo cliente não deve ser tratado como prova de segurança. |
| RNF-05 | O nome físico do arquivo deve ser gerado pelo servidor. Nunca usar o nome enviado pelo cliente para compor um caminho; resolver o caminho somente a partir do diretório configurado e do nome interno gerado. |
| RNF-06 | Downloads devem usar `Content-Disposition: attachment` e `X-Content-Type-Options: nosniff`; não servir o conteúdo como página ativa. |
| RNF-07 | A API deve validar entrada nas fronteiras HTTP e não retornar stack traces, caminhos físicos ou detalhes internos em respostas de erro. |
| RNF-08 | O MVP assume uma instância de backend em execução. Como os metadados são mantidos em memória, não há garantia de catálogo compartilhado entre processos ou instâncias. |

### Configuração inicial

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `STORAGE_DIR` | `backend/storage` | Diretório local dos binários; caminho relativo deve ser resolvido a partir da raiz do backend, não da requisição. |
| `MAX_FILE_SIZE_BYTES` | `10485760` | Limite máximo por arquivo, em bytes; deve ser um inteiro positivo. |
| `DEFAULT_DOCUMENT_OWNER` | `local-user` | Owner associado aos uploads neste MVP, sem autenticação. |

O valor de `STORAGE_DIR` pode ser absoluto ou relativo à raiz do backend. O diretório deve existir ou ser criado pela aplicação com permissões adequadas. `backend/storage` deve permanecer local e não ser exposto como diretório estático público.

## 5. Modelo de dados (metadados do documento)

### Registro interno

| Campo | Tipo | Visibilidade | Descrição |
| --- | --- | --- | --- |
| `id` | string | Público | Identificador único; usar UUID v4 como premissa do MVP. |
| `originalName` | string | Público | Nome-base fornecido pelo usuário, sem componentes de caminho ou caracteres de controle. |
| `size` | number | Público | Tamanho do binário em bytes, como inteiro não negativo. |
| `uploadedAt` | string | Público | Data/hora UTC de criação em ISO 8601. |
| `owner` | string | Público | Valor de `DEFAULT_DOCUMENT_OWNER`; não é identidade autenticada. |
| `storageName` | string | Interno | Nome físico aleatório/gerado pelo servidor, usado para localizar o arquivo. Nunca retornar pela API. |

O repositório mantém os registros em uma estrutura em memória indexada por `id`. O binário correspondente é mantido em `STORAGE_DIR` com o nome interno. O nome original nunca é usado como caminho. O owner é atribuído pelo servidor; o cliente não pode escolhê-lo nesta fase.

Quando o processo reiniciar, os arquivos que permanecerem no diretório não terão metadados associados no catálogo. O MVP não deve apagar arquivos automaticamente na inicialização, pois não há índice durável para distinguir arquivos válidos de órfãos. A política de limpeza operacional fica para uma etapa futura.

### Representação pública

```json
{
	"id": "a UUID",
	"originalName": "relatorio.pdf",
	"size": 24576,
	"uploadedAt": "2026-09-29T12:00:00.000Z",
	"owner": "local-user"
}
```

`storageName` e caminhos absolutos/relativos do filesystem não fazem parte da representação pública.

## 6. Contratos de API

O backend expõe as rotas abaixo. No desenvolvimento, o frontend chama o mesmo caminho sob o prefixo `/api` (por exemplo, `/api/documents`); o proxy Vite remove `/api` antes de encaminhar a requisição ao backend.

### Formato de erro

Erros da API retornam `Content-Type: application/json` e o formato abaixo. As mensagens não devem conter caminhos locais, stack traces ou dados internos.

```json
{
	"error": {
		"code": "DOCUMENT_NOT_FOUND",
		"message": "Documento não encontrado."
	}
}
```

### `POST /upload`

- Entrada: `multipart/form-data` com exatamente um arquivo no campo `file`.
- Limite: `MAX_FILE_SIZE_BYTES`; não há allowlist de extensão ou MIME no MVP.
- Saída `201 Created`: metadados públicos do documento criado.
- Erros: `400 Bad Request` se o arquivo estiver ausente ou o formulário for inválido; `413 Payload Too Large` se exceder o limite; `500 Internal Server Error` para falha inesperada de armazenamento.
- Respostas de erro usam o formato JSON definido acima. Erros do Multer devem ser traduzidos para os status correspondentes.
- O servidor gera `id` e `storageName`, define `uploadedAt` e `owner`, e não aceita esses campos do cliente.
- Se o registro em memória falhar depois de gravar o binário, a implementação deve remover o arquivo recém-gravado para evitar um órfão causado por falha durante a requisição.

Exemplo de sucesso:

```json
{
	"id": "a UUID",
	"originalName": "relatorio.pdf",
	"size": 24576,
	"uploadedAt": "2026-09-29T12:00:00.000Z",
	"owner": "local-user"
}
```

### `GET /documents`

- Entrada: sem corpo ou parâmetros obrigatórios.
- Saída `200 OK`: catálogo completo conhecido pelo processo, ordenado do mais recente para o mais antigo.
- Corpo:

```json
{
	"documents": [
		{
			"id": "a UUID",
			"originalName": "relatorio.pdf",
			"size": 24576,
			"uploadedAt": "2026-09-29T12:00:00.000Z",
			"owner": "local-user"
		}
	]
}
```

- Se não houver documentos, retornar `200 OK` com `"documents": []`.
- Não há paginação ou filtro por usuário no MVP. Nenhum caminho ou campo interno pode ser incluído.

### `GET /documents/:id/download`

- Entrada: `id` no path.
- Saída `200 OK`: conteúdo binário do arquivo como anexo, com `Content-Disposition: attachment` usando o nome original devidamente codificado, `Content-Type: application/octet-stream` e `X-Content-Type-Options: nosniff`.
- Erros: `404 Not Found` se o id não existir no catálogo ou se o binário associado estiver indisponível; `500 Internal Server Error` para outras falhas de leitura.
- Erros são retornados em JSON no formato comum. A resposta não revela o caminho físico.

## 7. Decisões arquiteturais

- Backend em Node.js e Express, CommonJS; frontend em React e Vite, ESM.
- Fluxo de dependência: `routes -> controllers -> services -> repositories`.
- `routes/` registra os endpoints e o middleware Multer configurado com `diskStorage`; o upload tem um campo de arquivo e limites explícitos.
- `controllers/` traduzem HTTP para chamadas de serviço, fazem validação básica da entrada e constroem status, headers e respostas.
- `services/` concentram as regras do documento: geração de identificador, atribuição de owner, criação/listagem e decisão de erro de domínio.
- `repositories/` isolam o catálogo de metadados em memória e o acesso ao arquivo local necessário para persistir/ler os binários. O modelo de domínio não depende de Express ou Multer.
- O armazenamento local usa `STORAGE_DIR`; Multer grava com nome interno gerado pelo servidor. Não usar storage em memória do Multer nem serviços externos.
- O frontend organiza a experiência em páginas/componentes e concentra chamadas `fetch` em `services/`, usando o prefixo `/api` do proxy Vite.
- Testes do backend usam o runner nativo `node:test` já adotado pelo repositório. Testes que escrevem arquivos devem usar diretório temporário e removê-lo ao final.
- Variáveis de ambiente são a fonte de configuração. Valores inválidos devem causar erro claro na inicialização, em vez de serem aceitos silenciosamente.

## 8. Plano de execução

As etapas abaixo descrevem trabalho futuro de implementação. Nesta etapa do Passo 1, o único artefato a criar é este documento; nenhum arquivo de backend ou frontend faz parte da execução atual.

1. **Configuração e infraestrutura local:** validar as variáveis de ambiente, preparar o diretório de armazenamento e configurar Multer `diskStorage`, geração de nome físico seguro e limite de tamanho.
2. **Modelo, repositório e serviço:** criar o modelo de metadados, catálogo em memória e operações de criação, listagem e leitura; gerar UUID e atribuir o owner configurado.
3. **API e testes de backend:** adicionar rotas, controllers e tratamento de erros para os três endpoints; cobrir upload, tamanho excedido, listagem vazia/preenchida, download e documento inexistente usando `node:test`.
4. **Interface React:** implementar seleção/upload de arquivo, estado de carregamento e erro, atualização da lista e ação de download; concentrar comunicação HTTP em `frontend/src/services/` e usar o proxy `/api`.
5. **Integração e validação:** executar testes e build existentes, testar o fluxo completo na aplicação, conferir headers de download, limite configurado, ausência de caminhos internos e comportamento após reinício compatível com metadados voláteis.
6. **Documentação operacional:** documentar configuração local e a limitação de persistência; definir, fora do MVP, política de limpeza dos binários órfãos antes de automatizar qualquer remoção.
