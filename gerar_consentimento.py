"""
Gera o documento Word de consentimento para o Predictor Mundial 2026.
Uma página por jogador com os prognósticos da BD, observações e assinatura.
"""
import json, datetime
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

# ── Carregar dados ────────────────────────────────────────────────────────────
with open("/tmp/predictor_data.json", encoding="utf-8") as f:
    dados = json.load(f)

participantes = dados["participantes"]
jogos         = dados["jogos"]
prognosticos  = dados["prognosticos"]

grupos_order = list(dict.fromkeys(j["grupo"] for j in jogos))  # ordem de aparição
hoje = datetime.date.today().strftime("%d de %B de %Y")

# ── Cores ─────────────────────────────────────────────────────────────────────
AZUL_ESCURO  = RGBColor(0x1a, 0x3a, 0x6e)
AZUL_CLARO   = RGBColor(0xe8, 0xee, 0xf5)
AMARELO      = RGBColor(0xf5, 0xa6, 0x23)
VERMELHO     = RGBColor(0xc0, 0x39, 0x2b)
BRANCO       = RGBColor(0xff, 0xff, 0xff)
CINZA_CLARO  = RGBColor(0xf5, 0xf7, 0xfa)
CINZA_TEXTO  = RGBColor(0x55, 0x55, 0x55)

# ── Helpers ───────────────────────────────────────────────────────────────────
def rgb_hex(rgb: RGBColor) -> str:
    return f"{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}"

def set_cell_bg(cell, rgb: RGBColor):
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd  = OxmlElement("w:shd")
    shd.set(qn("w:val"),   "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"),  rgb_hex(rgb))
    tcPr.append(shd)

def set_cell_border(cell, sides=("top","bottom","left","right"), size=4, color="1A3A6E"):
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement("w:tcBorders")
    for side in sides:
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:val"),   "single")
        el.set(qn("w:sz"),    str(size))
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color)
        tcBorders.append(el)
    tcPr.append(tcBorders)

def para_fmt(para, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=0):
    fmt = para.paragraph_format
    fmt.alignment    = align
    fmt.space_before = Pt(space_before)
    fmt.space_after  = Pt(space_after)

def add_run(para, text, bold=False, italic=False, size=9, color=None):
    run = para.add_run(text)
    run.bold   = bold
    run.italic = italic
    run.font.size  = Pt(size)
    run.font.color.rgb = color or RGBColor(0x11, 0x11, 0x11)
    return run

def page_break(doc):
    para = doc.add_paragraph()
    run  = para.add_run()
    run.add_break(__import__("docx.enum.text", fromlist=["WD_BREAK"]).WD_BREAK.PAGE)
    para_fmt(para)

def set_col_width(table, col_idx, width_cm):
    for row in table.rows:
        row.cells[col_idx].width = Cm(width_cm)

# ── Documento ─────────────────────────────────────────────────────────────────
doc = Document()

# Margens estreitas
for section in doc.sections:
    section.page_width   = Cm(21)
    section.page_height  = Cm(29.7)
    section.left_margin  = Cm(1.8)
    section.right_margin = Cm(1.8)
    section.top_margin   = Cm(1.5)
    section.bottom_margin = Cm(1.5)

# Estilo Normal base
style = doc.styles["Normal"]
style.font.name = "Calibri"
style.font.size = Pt(9)

# ── Uma página por jogador ────────────────────────────────────────────────────
for idx_p, nome in enumerate(participantes):
    preds = prognosticos.get(nome, {})

    # ── Cabeçalho do documento ──────────────────────────────────────────────
    title_para = doc.add_paragraph()
    para_fmt(title_para, space_after=1)
    run_trophy = title_para.add_run("🏆  ")
    run_trophy.font.size = Pt(14)
    add_run(title_para, "Predictor Parque Biológico — Mundial 2026",
            bold=True, size=13, color=AZUL_ESCURO)

    sub_para = doc.add_paragraph()
    para_fmt(sub_para, space_after=4)
    add_run(sub_para, "Folha de Consentimento e Verificação de Prognósticos",
            italic=True, size=9, color=CINZA_TEXTO)

    # Linha separadora
    sep = doc.add_paragraph()
    para_fmt(sep, space_before=0, space_after=3)
    sep_run = sep.add_run("─" * 100)
    sep_run.font.size  = Pt(5)
    sep_run.font.color.rgb = AZUL_ESCURO

    # Banner com nome + data
    banner = doc.add_table(rows=1, cols=2)
    banner.style = "Table Grid"
    banner.alignment = WD_TABLE_ALIGNMENT.LEFT
    banner.autofit = False
    banner.columns[0].width = Cm(11)
    banner.columns[1].width = Cm(5.4)

    cell_nome = banner.cell(0, 0)
    cell_data = banner.cell(0, 1)
    set_cell_bg(cell_nome, AZUL_ESCURO)
    set_cell_bg(cell_data, AZUL_ESCURO)

    p_nome = cell_nome.paragraphs[0]
    para_fmt(p_nome, space_before=3, space_after=3)
    add_run(p_nome, "Jogador:  ", size=9, color=BRANCO)
    add_run(p_nome, nome, bold=True, size=12, color=AMARELO)

    p_data = cell_data.paragraphs[0]
    para_fmt(p_data, align=WD_ALIGN_PARAGRAPH.RIGHT, space_before=5, space_after=5)
    add_run(p_data, f"Data: {hoje}", size=8, color=BRANCO)

    doc.add_paragraph()  # espaço

    # ── Instrução ───────────────────────────────────────────────────────────
    inst_para = doc.add_paragraph()
    para_fmt(inst_para, space_before=0, space_after=6)
    add_run(inst_para, "Instruções: ", bold=True, size=8, color=AZUL_ESCURO)
    add_run(inst_para,
            "Compare os prognósticos abaixo com a fotocópia da folha original. "
            "Registe na secção de observações qualquer resultado que não coincida. "
            "Assine no final para confirmar a validação.",
            size=8, color=CINZA_TEXTO)

    # ── Título da secção grupos ──────────────────────────────────────────────
    gs_title = doc.add_paragraph()
    para_fmt(gs_title, space_before=2, space_after=4)
    add_run(gs_title, "⚽  FASE DE GRUPOS — Prognósticos registados na Base de Dados",
            bold=True, size=9.5, color=AZUL_ESCURO)

    # ── Tabela de grupos: 6 grupos por linha (2 colunas de 6) ───────────────
    # Tabela exterior: 1 linha × 2 células
    outer = doc.add_table(rows=1, cols=2)
    outer.style = "Table Grid"
    outer.alignment = WD_TABLE_ALIGNMENT.LEFT
    outer.autofit = False
    outer.columns[0].width = Cm(8.2)
    outer.columns[1].width = Cm(8.2)

    # Remover bordas da tabela exterior
    for cell in outer.rows[0].cells:
        set_cell_border(cell, sides=("top","bottom","left","right"), size=0, color="FFFFFF")

    metade = [grupos_order[:6], grupos_order[6:]]
    for col_idx, grp_list in enumerate(metade):
        cell = outer.rows[0].cells[col_idx]
        cell.vertical_alignment = WD_ALIGN_VERTICAL.TOP

        for grupo in grp_list:
            jogos_grupo = [j for j in jogos if j["grupo"] == grupo]

            # Título do grupo
            gp = cell.add_paragraph()
            para_fmt(gp, space_before=4, space_after=1)
            add_run(gp, f"  Grupo {grupo}", bold=True, size=8, color=BRANCO)
            # Fundo azul escuro via tabela interior de 1 célula
            # (mais fácil: usar parágrafo com shading — trick via XML)
            pPr = gp._p.get_or_add_pPr()
            shd = OxmlElement("w:shd")
            shd.set(qn("w:val"),   "clear")
            shd.set(qn("w:color"), "auto")
            shd.set(qn("w:fill"),  rgb_hex(AZUL_ESCURO))
            pPr.append(shd)

            # Tabela de jogos
            gt = cell.add_table(rows=1 + len(jogos_grupo), cols=4)
            gt.style = "Table Grid"
            gt.autofit = False

            # Larguras das colunas
            widths = [0.55, 2.9, 2.9, 0.85]
            for ci, w in enumerate(widths):
                for row in gt.rows:
                    row.cells[ci].width = Cm(w)

            # Cabeçalho
            hdrs = ["Cód", "Casa", "Fora", "Prev."]
            for ci, hdr in enumerate(hdrs):
                hcell = gt.rows[0].cells[ci]
                set_cell_bg(hcell, AZUL_CLARO)
                hp = hcell.paragraphs[0]
                para_fmt(hp, space_before=1, space_after=1)
                add_run(hp, hdr, bold=True, size=7, color=AZUL_ESCURO)

            # Linhas de jogos
            for ri, jogo in enumerate(jogos_grupo):
                row = gt.rows[ri + 1]
                pred = preds.get(jogo["codigo"])
                pred_str = f"{pred['casa']}–{pred['fora']}" if pred else "—"

                valores = [jogo["codigo"], jogo["casa"], jogo["fora"], pred_str]
                colors  = [AZUL_ESCURO, None, None, VERMELHO]
                bolds   = [True, False, False, True]
                bg      = CINZA_CLARO if ri % 2 == 0 else BRANCO

                for ci, (val, cor, b) in enumerate(zip(valores, colors, bolds)):
                    c = row.cells[ci]
                    set_cell_bg(c, bg)
                    p = c.paragraphs[0]
                    para_fmt(p, space_before=1, space_after=1)
                    add_run(p, val, bold=b, size=7.5, color=cor or RGBColor(0x22,0x22,0x22))

            # Espaço entre grupos
            cell.add_paragraph()

    doc.add_paragraph()  # espaço após tabela

    # ── Observações ─────────────────────────────────────────────────────────
    obs_title = doc.add_paragraph()
    para_fmt(obs_title, space_before=4, space_after=4)
    add_run(obs_title, "📋  OBSERVAÇÕES — Resultados que não coincidem com a folha original",
            bold=True, size=9.5, color=AZUL_ESCURO)

    obs_table = doc.add_table(rows=9, cols=4)
    obs_table.style = "Table Grid"
    obs_table.alignment = WD_TABLE_ALIGNMENT.LEFT
    obs_table.autofit = False

    col_widths = [2.2, 3.5, 3.5, 7.2]  # total ~16.4cm
    for ci, w in enumerate(col_widths):
        for row in obs_table.rows:
            row.cells[ci].width = Cm(w)

    # Cabeçalho obs
    obs_hdrs = ["Jogo (código)", "Prognóstico na folha", "Prognóstico na BD", "Nota / Decisão tomada"]
    for ci, hdr in enumerate(obs_hdrs):
        c = obs_table.rows[0].cells[ci]
        set_cell_bg(c, AZUL_ESCURO)
        p = c.paragraphs[0]
        para_fmt(p, space_before=2, space_after=2)
        add_run(p, hdr, bold=True, size=7.5, color=BRANCO)

    # Linhas em branco
    for ri in range(1, 9):
        bg = CINZA_CLARO if ri % 2 == 0 else BRANCO
        for ci in range(4):
            c = obs_table.rows[ri].cells[ci]
            set_cell_bg(c, bg)
            p = c.paragraphs[0]
            para_fmt(p, space_before=5, space_after=5)
            p.add_run("")  # célula vazia

    doc.add_paragraph()

    # ── Declaração de consentimento ──────────────────────────────────────────
    decl_title = doc.add_paragraph()
    para_fmt(decl_title, space_before=4, space_after=3)
    add_run(decl_title, "📝  DECLARAÇÃO DE CONSENTIMENTO",
            bold=True, size=9.5, color=AZUL_ESCURO)

    decl_box = doc.add_table(rows=1, cols=1)
    decl_box.style = "Table Grid"
    decl_box.autofit = False
    decl_box.columns[0].width = Cm(16.4)
    set_cell_bg(decl_box.rows[0].cells[0], RGBColor(0xf0, 0xf4, 0xfa))

    decl_cell = decl_box.rows[0].cells[0]
    decl_p = decl_cell.paragraphs[0]
    para_fmt(decl_p, space_before=5, space_after=5)
    add_run(decl_p, f"Eu, ", size=9)
    add_run(decl_p, nome, bold=True, size=9)
    add_run(decl_p,
            ", declaro que revi os prognósticos acima listados e confirmo que são os mesmos "
            "que preenchi na folha original, com exceção das discrepâncias registadas nas observações acima. "
            "Aceito que os valores na Base de Dados sejam os utilizados para efeitos de classificação final do Predictor.",
            size=9)

    doc.add_paragraph()

    # Linha de assinatura + data
    sign_table = doc.add_table(rows=2, cols=2)
    sign_table.style = "Table Grid"
    sign_table.alignment = WD_TABLE_ALIGNMENT.LEFT
    sign_table.autofit = False
    sign_table.columns[0].width = Cm(10)
    sign_table.columns[1].width = Cm(6.4)

    for r in range(2):
        for c in range(2):
            set_cell_border(sign_table.rows[r].cells[c],
                            sides=("top","bottom","left","right"), size=0, color="FFFFFF")

    # Linha 0: linhas de assinatura
    p_sign = sign_table.rows[0].cells[0].paragraphs[0]
    para_fmt(p_sign, space_before=20, space_after=2)
    add_run(p_sign, "_" * 55, size=9)

    p_date_line = sign_table.rows[0].cells[1].paragraphs[0]
    para_fmt(p_date_line, space_before=20, space_after=2)
    add_run(p_date_line, "_" * 30, size=9)

    # Linha 1: labels
    p_sign_lbl = sign_table.rows[1].cells[0].paragraphs[0]
    para_fmt(p_sign_lbl, space_before=1, space_after=4)
    add_run(p_sign_lbl, f"Assinatura de {nome}", italic=True, size=8, color=CINZA_TEXTO)

    p_date_lbl = sign_table.rows[1].cells[1].paragraphs[0]
    para_fmt(p_date_lbl, space_before=1, space_after=4)
    add_run(p_date_lbl, "Data: ___ / ___ / 2026", italic=True, size=8, color=CINZA_TEXTO)

    # Rodapé da página
    doc.add_paragraph()
    footer_p = doc.add_paragraph()
    para_fmt(footer_p, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=0)
    add_run(footer_p,
            f"Predictor Parque Biológico — Mundial 2026  ·  Jogador: {nome}  ·  {hoje}  ·  "
            f"Pág. {idx_p + 1} de {len(participantes)}",
            size=7, color=RGBColor(0xaa, 0xaa, 0xaa))

    # Quebra de página (excepto último)
    if idx_p < len(participantes) - 1:
        page_break(doc)

# ── Guardar ───────────────────────────────────────────────────────────────────
out = "/Users/joaogarcia/Projects/predictor-mundial-2026/Consentimento_Predictor_Mundial_2026.docx"
doc.save(out)
print(f"✅ Documento criado: {out}")
print(f"   {len(participantes)} páginas — uma por jogador")
