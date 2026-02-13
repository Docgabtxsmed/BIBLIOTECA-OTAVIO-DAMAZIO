import pdfplumber
import json
import os
import re

"""
SCRIPT DE EXTRAÇÃO DE DADOS DE PDF PARA JSON (DIDÁTICO)
Este script automatiza a leitura de arquivos PDF de apresentações e os converte
em um formato JSON estruturado, compatível com o sistema do site.
"""

def extrair_texto_pdf(caminho_pdf):
    """
    Função principal para ler o PDF e organizar o conteúdo em seções.
    """
    secoes = []
    # Seção inicial padrão para capturar qualquer texto antes do primeiro título identificado
    secao_atual = {"id": "conteudo", "title": "Conteúdo Extraído", "content": []}
    
    # Abre o arquivo PDF usando a biblioteca pdfplumber
    with pdfplumber.open(caminho_pdf) as pdf:
        texto_completo = ""
        # Percorre cada página do PDF
        for pagina in pdf.pages:
            texto = pagina.extract_text()
            if texto:
                # Acumula o texto de todas as páginas, separando-as por quebra de linha
                texto_completo += texto + "\n"
        
        # Divide o texto completo em linhas para facilitar a análise heurística
        linhas = texto_completo.split('\n')
        for linha in linhas:
            linha = linha.strip()
            if not linha:
                continue
                
            # HEURÍSTICA DE DETECÇÃO DE TÍTULOS:
            # Identificamos uma linha como título se:
            # 1. Tiver menos de 50 caracteres (linhas curtas tendem a ser títulos)
            # 2. Estiver toda em maiúsculas OU contiver palavras-chave importantes
            palavras_chave = ["introdução", "objetivo", "método", "resultado", "conclusão", "referência"]
            e_titulo = len(linha) < 50 and (linha.isupper() or any(pw in linha.lower() for pw in palavras_chave))
            
            if e_titulo:
                # Se já temos conteúdo na seção anterior, nós a salvamos na lista de seções
                if secao_atual["content"]:
                    secoes.append(secao_atual)
                
                # Prepara a nova seção
                titulo = linha
                # Gera um ID amigável para URL (ex: "INTRODUÇÃO" -> "introdu-o")
                id_secao = re.sub(r'[^a-z0-0]', '-', titulo.lower()).strip('-')
                secao_atual = {"id": id_secao, "title": titulo, "content": []}
            else:
                # Se não for título, adiciona a linha como um item de texto à seção atual
                secao_atual["content"].append({"type": "text", "value": linha})
        
        # Adiciona a última seção processada à lista
        if secao_atual["content"]:
            secoes.append(secao_atual)
            
    return secoes

def criar_estrutura_json(nome_arquivo, secoes):
    """
    Organiza os dados extraídos na estrutura JSON final exigida pelo site.
    """
    # Extrai uma sugestão de nome do autor partindo do nome do arquivo
    partes_nome = os.path.splitext(nome_arquivo)[0].split(' ')
    nome_autor = partes_nome[0] if partes_nome else "Autor"
    
    # Monta o dicionário com os metadados e as seções
    dados = {
        "id": os.path.splitext(nome_arquivo)[0].lower().replace(" ", "-"),
        "meta": {
            "title": nome_arquivo,
            "subtitle": "Extraído automaticamente do PDF",
            "authors": [nome_autor],
            "backgroundImage": "../../assets/images/default_bg.png",
            "institution": "CET Otávio Damázio Filho",
            "date": "2026"
        },
        "sections": secoes
    }
    return dados

def processar_pasta_pdfs(diretorio_entrada, diretorio_saida):
    """
    Percorre uma pasta, processa cada PDF encontrado e salva como JSON.
    """
    # Cria a pasta de saída se ela não existir
    if not os.path.exists(diretorio_saida):
        os.makedirs(diretorio_saida)
        
    # Lista todos os arquivos na pasta de entrada
    for arquivo in os.listdir(diretorio_entrada):
        if arquivo.lower().endswith(".pdf"):
            print(f"Lendo PDF: {arquivo}...")
            caminho_completo = os.path.join(diretorio_entrada, arquivo)
            
            # Passo 1: Extrair e organizar o texto
            secoes = extrair_texto_pdf(caminho_completo)
            
            # Passo 2: Formatar na estrutura JSON do projeto
            dados_finais = criar_estrutura_json(arquivo, secoes)
            
            # Passo 3: Salvar o arquivo JSON
            nome_saida = os.path.splitext(arquivo)[0].lower().replace(" ", "-") + ".json"
            caminho_saida = os.path.join(diretorio_saida, nome_saida)
            
            with open(caminho_saida, 'w', encoding='utf-8') as f:
                json.dump(dados_finais, f, ensure_ascii=False, indent=2)
            
            print(f"Sucesso! JSON gerado em: {caminho_saida}")

# PONTO DE ENTRADA DO SCRIPT
if __name__ == "__main__":
    # Configuração de pastas
    PASTA_ENTRADA = "apresentacoes-pdf"
    PASTA_SAIDA = os.path.join("data", "apresentacoes")
    
    # Inicia o processo
    processar_pasta_pdfs(PASTA_ENTRADA, PASTA_SAIDA)
