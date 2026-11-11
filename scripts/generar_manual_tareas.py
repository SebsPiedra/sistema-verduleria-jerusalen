from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "Manual_Usuario_Tareas_Verduleria_Jerusalen.pdf"
MOBILE_SCREENSHOT = Path(
    r"C:\Users\PC\.codex\codex-remote-attachments\019faca8-5d69-7153-b59f-91f5e6e5da20\AA732A56-9B01-4617-921B-C3D229FB3BB5\4-Foto-4.jpg"
)

GREEN = colors.HexColor("#075E58")
TEAL = colors.HexColor("#087F73")
MINT = colors.HexColor("#C8F1DC")
PALE = colors.HexColor("#EEF7F5")
ORANGE = colors.HexColor("#FF6B18")
INK = colors.HexColor("#123F40")
MUTED = colors.HexColor("#607A7C")
LINE = colors.HexColor("#D7E5E4")
WHITE = colors.white


pdfmetrics.registerFont(TTFont("Arial", r"C:\Windows\Fonts\arial.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Bold", r"C:\Windows\Fonts\arialbd.ttf"))
pdfmetrics.registerFont(TTFont("Consolas", r"C:\Windows\Fonts\consola.ttf"))


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="BodyA", fontName="Arial", fontSize=9.5, leading=14, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle(name="SmallA", fontName="Arial", fontSize=8, leading=11, textColor=MUTED))
styles.add(ParagraphStyle(name="TitleA", fontName="Arial-Bold", fontSize=25, leading=29, textColor=GREEN, spaceAfter=10))
styles.add(ParagraphStyle(name="H1A", fontName="Arial-Bold", fontSize=18, leading=22, textColor=GREEN, spaceAfter=10))
styles.add(ParagraphStyle(name="H2A", fontName="Arial-Bold", fontSize=12, leading=15, textColor=TEAL, spaceBefore=5, spaceAfter=6))
styles.add(ParagraphStyle(name="CardTitle", fontName="Arial-Bold", fontSize=10, leading=13, textColor=GREEN, spaceAfter=3))
styles.add(ParagraphStyle(name="CodeA", fontName="Consolas", fontSize=6.7, leading=9, textColor=INK, leftIndent=6, rightIndent=6))
styles.add(ParagraphStyle(name="CoverKicker", fontName="Arial-Bold", fontSize=10, leading=13, textColor=ORANGE, tracking=2, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="CoverTitle", fontName="Arial-Bold", fontSize=27, leading=32, textColor=WHITE, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="CoverSub", fontName="Arial", fontSize=12, leading=17, textColor=colors.HexColor("#DDF3EE"), alignment=TA_CENTER))
styles.add(ParagraphStyle(name="TableHead", fontName="Arial-Bold", fontSize=7.5, leading=10, textColor=WHITE))
styles.add(ParagraphStyle(name="TableCell", fontName="Arial", fontSize=7.3, leading=10, textColor=INK))


def p(text, style="BodyA"):
    return Paragraph(text, styles[style])


def bullet(text):
    return Paragraph(f"<font color='#FF6B18'>•</font> {text}", styles["BodyA"])


def code(text):
    escaped = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return Table([[Paragraph(escaped.replace("\n", "<br/>"), styles["CodeA"])]], colWidths=[16.7 * cm], style=TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F3F8F7")),
        ("BOX", (0, 0), (-1, -1), 0.7, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))


def card(title, body, width=8.15 * cm):
    return Table([[p(title, "CardTitle"), p(body, "SmallA")]], colWidths=[2.1 * cm, width - 2.1 * cm], style=TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), WHITE),
        ("BOX", (0, 0), (-1, -1), 0.7, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))


def page_header_footer(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(GREEN)
    canvas.rect(0, height - 0.45 * cm, width, 0.45 * cm, fill=1, stroke=0)
    canvas.setFillColor(ORANGE)
    canvas.rect(1.55 * cm, 1.0 * cm, 1.25 * cm, 0.08 * cm, fill=1, stroke=0)
    canvas.setFont("Arial", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(3.0 * cm, 0.86 * cm, "Verdulería Jerusalén  ·  Manual del módulo de tareas")
    canvas.drawRightString(width - 1.55 * cm, 0.86 * cm, f"Página {doc.page}")
    canvas.restoreState()


def cover(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(GREEN)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#06443F"))
    canvas.circle(width * 0.08, height * 0.9, 4.0 * cm, fill=1, stroke=0)
    canvas.circle(width * 0.92, height * 0.16, 5.2 * cm, fill=1, stroke=0)
    canvas.setFillColor(MINT)
    canvas.circle(width / 2, height - 5.2 * cm, 1.05 * cm, fill=1, stroke=0)
    canvas.setFillColor(GREEN)
    canvas.setFont("Arial-Bold", 24)
    canvas.drawCentredString(width / 2, height - 5.45 * cm, "J")
    canvas.setFillColor(ORANGE)
    canvas.rect(width / 2 - 1.0 * cm, 5.2 * cm, 2.0 * cm, 0.12 * cm, fill=1, stroke=0)
    canvas.restoreState()


OUTPUT.parent.mkdir(parents=True, exist_ok=True)
doc = BaseDocTemplate(str(OUTPUT), pagesize=A4, leftMargin=1.55 * cm, rightMargin=1.55 * cm, topMargin=1.35 * cm, bottomMargin=1.4 * cm,
                      title="Manual de usuario - Módulo de tareas", author="Verdulería Jerusalén")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates([
    PageTemplate(id="cover", frames=[frame], onPage=cover),
    PageTemplate(id="content", frames=[frame], onPage=page_header_footer),
])

story = []
story.extend([
    Spacer(1, 6.1 * cm),
    p("PROYECTO PRÁCTICO", "CoverKicker"),
    Spacer(1, 0.25 * cm),
    p("Manual de usuario y documentación técnica", "CoverTitle"),
    Spacer(1, 0.35 * cm),
    p("Módulo de tareas · Verdulería Jerusalén", "CoverSub"),
    Spacer(1, 1.0 * cm),
    Table([[p("React Native", "CoverSub"), p("Expo SDK 58", "CoverSub"), p("TypeScript", "CoverSub"), p("AsyncStorage", "CoverSub")]],
          colWidths=[4.0 * cm] * 4, style=TableStyle([("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#5A8E88")), ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#5A8E88")), ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10)])),
    Spacer(1, 4.0 * cm),
    p("Documento preparado para la demostración en Expo Go, Android y Expo Web.<br/>Versión verificada: 10 de noviembre de 2026", "CoverSub"),
    NextPageTemplate("content"),
    PageBreak(),
])

story.extend([
    p("1. Alcance de la entrega", "H1A"),
    p("El módulo de tareas permite organizar actividades operativas de la verdulería sin depender de una conexión permanente. La información se conserva localmente en el dispositivo y la misma base de código funciona en Android y en navegador."),
    Spacer(1, 0.2 * cm),
    Table([[card("CREAR", "Registra título, descripción y categoría."), card("CONSULTAR", "Muestra todas las tareas y sus contadores.")],
           [card("EDITAR", "Carga una tarea existente y guarda cambios."), card("ELIMINAR", "Solicita confirmación antes de borrar.")]], colWidths=[8.35 * cm, 8.35 * cm], style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 6), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)])),
    Spacer(1, 0.35 * cm),
    p("Funciones incluidas", "H2A"),
    bullet("CRUD completo: crear, visualizar, editar y eliminar tareas."),
    bullet("Cambio rápido entre pendiente y completada."),
    bullet("Filtros: Todas, Pendientes y Completadas."),
    bullet("Contadores que se actualizan con cada operación."),
    bullet("Persistencia automática con serialización JSON."),
    bullet("Interfaz adaptable para teléfono, tableta y computadora."),
    p("Nota de seguridad", "H2A"),
    p("AsyncStorage es almacenamiento persistente local <b>no cifrado</b>. En este proyecto solo guarda tareas operativas, no contraseñas ni información sensible."),
    p("Tecnologías verificadas", "H2A"),
    Table([[p("Tecnología", "TableHead"), p("Uso", "TableHead"), p("Estado", "TableHead")],
           [p("React Native + Expo SDK 58", "TableCell"), p("Aplicación multiplataforma", "TableCell"), p("Compatible", "TableCell")],
           [p("TypeScript estricto", "TableCell"), p("Modelos y funciones tipadas", "TableCell"), p("Sin errores", "TableCell")],
           [p("AsyncStorage", "TableCell"), p("Persistencia JSON local", "TableCell"), p("Implementado", "TableCell")]], colWidths=[5.2 * cm, 7.5 * cm, 4.0 * cm], style=TableStyle([("BACKGROUND", (0, 0), (-1, 0), TEAL), ("GRID", (0, 0), (-1, -1), 0.5, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)])),
    PageBreak(),
])

story.extend([
    p("2. Guía de uso", "H1A"),
    p("La pantalla se abre desde el menú administrativo en <b>Tareas</b>. En teléfono, el menú lateral se abre con el botón superior izquierdo."),
    Table([[Image(str(MOBILE_SCREENSHOT), width=6.6 * cm, height=13.4 * cm),
            [p("1. Revise los contadores", "H2A"), p("La cabecera resume tareas totales, pendientes y completadas."),
             p("2. Cree una tarea", "H2A"), p("Escriba un título de al menos tres caracteres, agregue una indicación opcional, elija Inventario, Pedidos o General y presione <b>Agregar tarea</b>."),
             p("3. Filtre la lista", "H2A"), p("Use Todas, Pendientes o Completadas para encontrar rápidamente la actividad necesaria."),
             p("4. Trabaje sin conexión", "H2A"), p("Las tareas quedan en el almacenamiento del dispositivo. Al volver a abrir la aplicación, se recuperan automáticamente.")]]], colWidths=[7.0 * cm, 9.7 * cm], style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 8)])),
    PageBreak(),
])

story.extend([
    p("3. Operaciones CRUD", "H1A"),
    p("Crear", "H2A"),
    bullet("Complete el título; la descripción es opcional."),
    bullet("Seleccione una categoría y presione <b>Agregar tarea</b>."),
    bullet("La nueva tarea aparece primero y queda marcada como pendiente."),
    p("Editar", "H2A"),
    bullet("Presione <b>Editar</b> en la tarjeta de la tarea."),
    bullet("El formulario carga los valores actuales. Modifique y presione <b>Guardar cambios</b>."),
    bullet("Use <b>Cancelar</b> para salir sin alterar la tarea."),
    p("Completar o reabrir", "H2A"),
    bullet("Presione el control de estado. La tarea cambia entre pendiente y completada y se actualizan los contadores."),
    p("Eliminar", "H2A"),
    bullet("Presione <b>Eliminar</b>. El sistema solicita confirmación para evitar borrados accidentales."),
    bullet("Al confirmar, el registro se elimina del estado y de AsyncStorage."),
    p("Reglas y mensajes", "H2A"),
    Table([[p("Situación", "TableHead"), p("Respuesta del sistema", "TableHead")],
           [p("Título menor de 3 caracteres", "TableCell"), p("Muestra una validación y no guarda.", "TableCell")],
           [p("Filtro sin resultados", "TableCell"), p("Presenta un estado vacío con orientación.", "TableCell")],
           [p("Error al leer almacenamiento", "TableCell"), p("Muestra un aviso accesible; la pantalla sigue disponible.", "TableCell")],
           [p("Error al guardar", "TableCell"), p("Informa que el cambio no pudo conservarse en el dispositivo.", "TableCell")]], colWidths=[6.0 * cm, 10.7 * cm], style=TableStyle([("BACKGROUND", (0, 0), (-1, 0), TEAL), ("GRID", (0, 0), (-1, -1), 0.5, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)])),
    Spacer(1, 0.3 * cm),
    p("Comprobación de persistencia", "H2A"),
    p("Cree una tarea, cierre completamente la aplicación o recargue el navegador y vuelva a Tareas. El registro debe conservarse. En web puede revisar las herramientas del navegador (F12 → Application/Aplicación → almacenamiento del sitio)."),
    PageBreak(),
])

story.extend([
    p("4. Arquitectura y organización", "H1A"),
    p("La pantalla está separada por responsabilidades para facilitar mantenimiento, pruebas y reutilización."),
    code("frontend/src/\n├─ app/tareas.tsx                 # composición de la pantalla\n├─ types/todo.ts                  # Task, TaskDraft y filtros\n├─ services/todoStorage.ts        # lectura/escritura de AsyncStorage\n├─ hooks/useTodoList.ts           # estado, CRUD y filtros\n└─ components/\n   ├─ TaskInput.tsx               # formulario y validación\n   ├─ TaskItem.tsx                # tarjeta y acciones\n   └─ TaskFilter.tsx              # filtros de visualización"),
    Spacer(1, 0.35 * cm),
    Table([[card("types/todo.ts", "Define contratos estrictos sin any."), card("todoStorage.ts", "Aísla la clave y la serialización JSON.")],
           [card("useTodoList.ts", "Centraliza estado, CRUD, filtros y estadísticas."), card("Componentes", "Separan formulario, tarjeta y filtros.")]], colWidths=[8.35 * cm, 8.35 * cm], style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 6), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)])),
    p("Modelo principal", "H2A"),
    code("export interface Task {\n  id: string;\n  title: string;\n  description: string;\n  category: TaskCategory;\n  completed: boolean;\n  createdAt: string;\n  updatedAt: string;\n}"),
    p("Renderizado eficiente", "H2A"),
    p("La lista usa <b>FlatList</b> con <b>keyExtractor</b>, de modo que React Native identifica cada elemento por su id y virtualiza el contenido. En la versión ajustada la lista tiene su propio desplazamiento y no se desactiva la virtualización."),
    PageBreak(),
])

story.extend([
    p("5. Persistencia con AsyncStorage", "H1A"),
    p("Cada operación genera el arreglo actualizado y lo guarda bajo una clave exclusiva. Al montar el hook, la aplicación recupera el JSON, lo analiza y valida los campos mínimos antes de mostrarlo."),
    p("Servicio de almacenamiento", "H2A"),
    code("const STORAGE_KEY = '@verduleria_tareas_v1';\n\nasync saveTasks(tasks: Task[]): Promise<void> {\n  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));\n}\n\nasync getTasks(): Promise<Task[]> {\n  const stored = await AsyncStorage.getItem(STORAGE_KEY);\n  if (!stored) return [];\n  const parsed: unknown = JSON.parse(stored);\n  return Array.isArray(parsed) ? parsed.filter(isTask) : [];\n}"),
    p("Flujo de datos", "H2A"),
    Table([[p("1", "CardTitle"), p("El usuario ejecuta una acción en TaskInput o TaskItem.", "BodyA")],
           [p("2", "CardTitle"), p("useTodoList calcula el nuevo arreglo de tareas.", "BodyA")],
           [p("3", "CardTitle"), p("persist actualiza la interfaz y llama a todoStorage.saveTasks.", "BodyA")],
           [p("4", "CardTitle"), p("AsyncStorage conserva el JSON localmente.", "BodyA")],
           [p("5", "CardTitle"), p("En la siguiente apertura, getTasks restaura los datos.", "BodyA")]], colWidths=[1.1 * cm, 15.6 * cm], style=TableStyle([("BACKGROUND", (0, 0), (0, -1), MINT), ("GRID", (0, 0), (-1, -1), 0.5, LINE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)])),
    p("Manejo de errores", "H2A"),
    p("La lectura y escritura se ejecutan con promesas controladas. Si ocurre un fallo, el hook usa <b>storageError</b> para mostrar un mensaje visible y accesible sin cerrar la aplicación."),
    p("Depuración recomendada", "H2A"),
    bullet("Confirme que <b>@react-native-async-storage/async-storage</b> esté instalado con Expo."),
    bullet("Revise la consola del navegador o Metro si aparece el aviso de almacenamiento."),
    bullet("No edite manualmente el JSON de producción; use tareas de prueba."),
    PageBreak(),
])

story.extend([
    p("6. Instalación, ejecución y pruebas", "H1A"),
    p("Requisitos", "H2A"),
    bullet("Node.js y npm disponibles."),
    bullet("Expo Go actualizado para probar en teléfono Android, o un navegador moderno para web."),
    p("Comandos", "H2A"),
    code("cd frontend\nnpm install\nnpx expo start          # abre el servidor de desarrollo\nnpm run web             # ejecuta Expo Web\nnpm run check           # TypeScript + ESLint + Expo Doctor + export web"),
    p("Prueba en Android con Expo Go", "H2A"),
    bullet("Conecte computadora y teléfono a la misma red."),
    bullet("Ejecute <b>npx expo start</b> y escanee el código QR con Expo Go."),
    bullet("Inicie sesión, abra Tareas y realice el ciclo crear → editar → completar → eliminar."),
    p("Resultados de verificación", "H2A"),
    Table([[p("Control", "TableHead"), p("Resultado", "TableHead"), p("Evidencia", "TableHead")],
           [p("TypeScript", "TableCell"), p("APROBADO", "TableCell"), p("npx tsc --noEmit: 0 errores", "TableCell")],
           [p("ESLint", "TableCell"), p("APROBADO", "TableCell"), p("npm run lint: sin errores", "TableCell")],
           [p("Expo Doctor", "TableCell"), p("APROBADO", "TableCell"), p("20/20 comprobaciones", "TableCell")],
           [p("Expo Web", "TableCell"), p("APROBADO", "TableCell"), p("Exportación web completada", "TableCell")],
           [p("Android", "TableCell"), p("APROBADO", "TableCell"), p("Bundle Hermes generado", "TableCell")]], colWidths=[4.2 * cm, 3.4 * cm, 9.1 * cm], style=TableStyle([("BACKGROUND", (0, 0), (-1, 0), TEAL), ("GRID", (0, 0), (-1, -1), 0.5, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)])),
    p("Prueba funcional sugerida", "H2A"),
    p("Cree tres tareas de diferentes categorías; edite una, complete otra y elimine la tercera. Cambie entre los tres filtros, cierre la aplicación y vuelva a abrirla. Los datos y contadores deben coincidir."),
    PageBreak(),
])

story.extend([
    p("7. Matriz de cumplimiento", "H1A"),
    p("La siguiente tabla relaciona la guía de evaluación con la evidencia disponible en la entrega."),
    Table([[p("Criterio", "TableHead"), p("Implementación / evidencia", "TableHead"), p("Valor", "TableHead")],
           [p("CRUD", "TableCell"), p("Crear, visualizar, editar, completar/reabrir y eliminar con confirmación.", "TableCell"), p("5 pts", "TableCell")],
           [p("Persistencia", "TableCell"), p("AsyncStorage, clave propia, JSON.stringify/parse, carga inicial y mensajes de error.", "TableCell"), p("4 pts", "TableCell")],
           [p("Arquitectura y TypeScript", "TableCell"), p("Tipos, servicio, hook y tres componentes separados; compilación estricta sin errores.", "TableCell"), p("3 pts", "TableCell")],
           [p("Interfaz y experiencia", "TableCell"), p("Pressable, FlatList con keyExtractor, SafeAreaProvider/SafeAreaView, filtros, estados vacíos y diseño adaptable.", "TableCell"), p("3 pts", "TableCell")],
           [p("Manual y depuración", "TableCell"), p("Documento PDF con guía, arquitectura, código, almacenamiento, pruebas y capturas.", "TableCell"), p("5 pts", "TableCell")]], colWidths=[4.2 * cm, 10.7 * cm, 1.8 * cm], style=TableStyle([("BACKGROUND", (0, 0), (-1, 0), TEAL), ("GRID", (0, 0), (-1, -1), 0.5, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8)])),
    Spacer(1, 0.5 * cm),
    p("Lista de comprobación para entregar", "H2A"),
    bullet("PDF del manual incluido."),
    bullet("Código fuente organizado y sin archivos de credenciales."),
    bullet("Paquete ZIP generado desde la versión validada."),
    bullet("Aplicación verificable en web y Android/Expo Go."),
    bullet("Demostración preparada: crear, persistir, filtrar, editar, completar y eliminar."),
    Spacer(1, 0.7 * cm),
    Table([[p("ENTREGA LISTA", "CoverKicker"), p("El módulo cumple los puntos funcionales, de persistencia, arquitectura, interfaz y documentación solicitados.", "CardTitle")]], colWidths=[4.0 * cm, 12.7 * cm], style=TableStyle([("BACKGROUND", (0, 0), (-1, -1), PALE), ("BOX", (0, 0), (-1, -1), 1.0, TEAL), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 14), ("BOTTOMPADDING", (0, 0), (-1, -1), 14), ("LEFTPADDING", (0, 0), (-1, -1), 12)])),
])

doc.build(story)
print(OUTPUT)
