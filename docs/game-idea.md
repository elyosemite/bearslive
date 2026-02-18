# Bear Population Game — Ideias e Design

## Conceito Central

Simulação de população de ursos baseada em seleção natural. O jogador não controla os ursos diretamente — ele interfere de forma **indireta** no ambiente para maximizar a sobrevivência da população.

O jogo está disponível para qualquer pessoa do mundo jogar, com visualização em tempo real de dados demográficos dos ursos sobre um mapa.

---

## Simulação — Atributos de cada urso

Cada urso é uma entidade independente com os seguintes atributos:

| Atributo | Descrição |
|---|---|
| `health` | Degrada por fome, doença e combate |
| `hunger` | Aumenta constantemente; se crítico, urso busca comida ou morre |
| `age` | Ursos jovens e velhos são mais vulneráveis |
| `strength` | Determina resultado de brigas e capacidade de caçar |
| `diseaseStatus` | Saudável, exposto, infectado ou imune |
| `fearLevel` | Alto = urso se esconde e não come; baixo = urso fica exposto a predadores |

A morte não é um evento binário — é uma **cascata de debilitação**:
> fome → fraqueza → derrota em briga → ferimento → incapacidade de caçar → morte

---

## O Mapa

Grid dividido em biomas com características distintas:

| Bioma | Cobertura | Alimento | Exposição a predadores |
|---|---|---|---|
| Floresta densa | Alta | Baixo | Baixa |
| Campo aberto | Nenhuma | Alto | Alta |
| Rio | Parcial | Alto (peixes) | Média — ponto de conflito entre ursos |
| Montanha | Total | Baixo | Nenhuma — abrigo para hibernação |

**Estações do ano** alteram o mapa em tempo real: no inverno, comida some e ursos hibernam. Ursos mais fracos não sobrevivem ao inverno.

---

## Dificuldade Proposital

O jogo é difícil por design — ursos morrem facilmente:

- **Doenças se propagam por proximidade** — contato entre ursos pode transmitir doenças
- **Inbreeding** — população pequena demais gera crias mais fracas
- **Predadores adaptam rotas** — se sempre afastados de uma zona, migram para outra
- **Eventos climáticos** — seca, incêndio, inundação podem destruir biomas inteiros
- **Caçadores furtivos** — evento aleatório que remove ursos silenciosamente

---

## Visualização em Tempo Real

Ursos aparecem como **pontos coloridos** sobre o mapa — sem skins, sem identidade visual individual.

Painel lateral com gráficos em tempo real:

- **Curva populacional** — clássico Lotka-Volterra (ursos × predadores)
- **Pirâmide etária** — filhotes, adultos, idosos
- **Causas de morte** — gráfico de pizza: fome, doença, predação, combate, velhice
- **Mapa de calor de densidade** — onde os ursos estão concentrados
- **Índice de saúde média** — termômetro geral da população

---

## Multiplayer Global

O mapa é dividido em **regiões**, cada jogador administra uma. Recursos de intervenção são **parcialmente compartilhados** entre regiões.

Isso cria dilemas de tragédia dos comuns — exatamente o que acontece na conservação real.

---

## Narrativas do Jogador (regras fixas)

O jogador **não pode**:
- Alimentar ursos diretamente
- Criar ursos
- Matar predadores

O jogador **interage de forma indireta** — três narrativas propostas:

---

### Narrativa 1 — Arquiteto do Território

O jogador é um engenheiro de habitat que manipula o **terreno e a vegetação**.

**Ações disponíveis:**
- Crescer ou queimar vegetação em zonas específicas
- Criar ou secar fontes de água
- Elevar ou abaixar terreno (barreiras, corredores, vales)
- Abrir ou fechar passagens entre biomas

**Lógica indireta:** predadores têm rotas naturais. Remodelar o terreno desvia predadores sem tocá-los. Uma montanha no lugar certo pode proteger uma colônia inteira.

**Risco:** remodelar pode isolar ursos de fontes de comida ou prender ursos em biomas hostis.

---

### Narrativa 2 — Controlador Climático

O jogador opera um **sistema de controle atmosférico** com alcance regional.

**Ações disponíveis:**
- Disparar chuva (cresce vegetação, cria água, desacelera predadores)
- Disparar neblina densa (esconde ursos de predadores visuais)
- Provocar frio intenso localizado (predadores migram; ursos resistentes sobrevivem)
- Provocar calor extremo (força migração de todos)

**Lógica indireta:** clima afeta predadores e ursos de formas diferentes. O jogador lê o estado dos animais e decide qual condição favorece mais os ursos naquele momento.

**Risco:** clima afeta tudo simultaneamente. Chuva excessiva pode inundar tocas. Frio mal calculado mata filhotes antes dos predadores.

---

### Narrativa 3 — Gestor da Cadeia Alimentar

O jogador controla **todas as outras espécies do ecossistema** — nunca os ursos nem os predadores.

**Ações disponíveis:**
- Aumentar ou reduzir populações de presas alternativas (cervos, peixes, coelhos)
- Introduzir ou remover espécies vegetais que geram ou destroem comida
- Propagar ou curar doenças em espécies de presa
- Concentrar presas numa zona específica do mapa

**Lógica indireta:** predadores seguem suas presas preferidas. Concentrar cervos no campo aberto tira predadores da rota dos ursos. O jogador manipula o que os predadores preferem caçar.

**Risco:** presas abundantes atraem mais predadores ao mapa com o tempo. Excesso de cervos pode destruir vegetação e deixar ursos sem comida.

---

## Comparativo das Narrativas

| | Manipula | Lógica central | Maior risco |
|---|---|---|---|
| Arquiteto do Território | Terreno e espaço | Rotas e barreiras físicas | Isolamento dos ursos |
| Controlador Climático | Condições atmosféricas | Comportamento por ambiente | Efeitos colaterais simultâneos |
| Gestor da Cadeia Alimentar | Outras espécies | Preferências de predadores | Superpopulação e colapso da vegetação |

---

## Stack Técnica

- **Frontend:** React + Vite + TypeScript
- **Estado global:** Zustand
- **Estrutura de pastas planejada:**

```
src/
├── stores/
│   └── useBearStore.ts
├── components/
│   └── BearCounter.tsx
├── types/
│   └── bear.ts
└── ...
```
