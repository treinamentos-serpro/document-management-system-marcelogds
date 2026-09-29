---
description: Analisa a saída de testes, identifica erros e sugere correções priorizadas.
name: analisar-testes
argument-hint: cole a saída dos testes e, opcionalmente, informe o comando executado
agent: agent
---

# Analisar resultado dos testes

Analise o resultado abaixo e o contexto relevante do workspace:

```text
${input:resultado:cole aqui a saída completa da execução dos testes}
```

Comando executado, se conhecido:

```text
${input:comando:npm test}
```

Siga estas etapas:

1. Determine se a execução passou, falhou, foi cancelada ou ficou inconclusiva.
2. Separe falhas de teste, erros de configuração, problemas de ambiente e avisos não bloqueantes.
3. Para cada falha, identifique o teste, o arquivo/linha quando disponível, a causa provável e o nível de confiança da hipótese.
4. Consulte os arquivos envolvidos e os padrões existentes do projeto antes de sugerir uma correção. Não invente APIs, comandos ou arquivos que não existam.
5. Sugira a menor correção necessária, priorizada por impacto. Inclua comandos de verificação e testes que devem ser executados depois.
6. Não altere arquivos, não faça commit e não execute comandos destrutivos. Só implemente a correção se o usuário solicitar explicitamente.

Use este formato de resposta:

## Resultado

- Status: `passou`, `falhou`, `cancelado` ou `inconclusivo`
- Resumo: quantidade de testes aprovados, falhos, ignorados ou cancelados, se disponível

## Problemas

Para cada problema real, liste:

- Severidade: `bloqueador`, `alto`, `médio` ou `baixo`
- Referência: teste, arquivo e linha, quando disponível
- Evidência: trecho objetivo da saída
- Causa provável: explicação técnica e nível de confiança
- Correção sugerida: mudança mínima e arquivo provável
- Validação: comando ou teste que confirma a correção

Se não houver erros, declare isso claramente e registre apenas avisos ou lacunas de cobertura relevantes.

## Próximos passos

Liste somente ações necessárias e ordenadas. Se a saída não for suficiente para diagnosticar, informe exatamente qual arquivo, comando ou trecho adicional é necessário.