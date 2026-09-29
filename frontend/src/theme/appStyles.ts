import { StyleSheet, TextStyle, ViewStyle, ImageStyle, useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

type Rule = ViewStyle & TextStyle & ImageStyle;
const colors: Record<string, string> = {
  '#f7f5ee':'#eef4f5', '#fffdf6':'#f8fbfc', '#fffcf3':'#f8fbfc',
  '#ebe4d3':'#dce8e9', '#e0d7c2':'#cfdee0', '#d7cfae':'#cfdee0', '#f0eadb':'#e7eff0',
  '#f7f2dc':'#e9f3f2', '#f7f2e7':'#e9f3f2', '#f4f1dc':'#e9f3f2',
  '#003f22':'#092c30', '#063f22':'#123c40', '#0f4f24':'#075e58', '#1b5e20':'#08736a',
  '#064b29':'#123e42', '#064c30':'#123c40', '#075333':'#075e58', '#0b5a37':'#08736a',
  '#7bb51e':'#087f73', '#8fbd3a':'#087f73', '#7cae36':'#087f73', '#72a629':'#087f73',
  '#f58220':'#ad4c11', '#e07b18':'#a94710', '#777':'#596c70', '#666':'#52656a',
};

/** Shared visual tokens. Existing status colors and business logic stay intact. */
export function createAppStyles<T extends StyleSheet.NamedStyles<T>>(rules: T): T {
  const result: Record<string, Rule> = {};
  for (const [name, original] of Object.entries(rules)) {
    const rule = { ...(original as Rule) };
    for (const key of ['color','backgroundColor','borderColor','borderBottomColor','borderTopColor'] as const) {
      const value = rule[key];
      if (typeof value === 'string' && colors[value.toLowerCase()]) (rule as any)[key] = colors[value.toLowerCase()];
    }
    if (/^(titulo|title|tituloSeccion)$/.test(name)) { rule.fontSize = Math.min(rule.fontSize || 28, 30); rule.letterSpacing = -0.7; }
    if (/^(card|tarjeta|tablaCaja|formulario|formCard|productoCard|contenedorPrincipal)$/.test(name)) {
      rule.borderRadius = 20; rule.borderWidth = 1; rule.borderColor = '#dce8e9';
    }
    if (/^(boton|button)/.test(name) && !/(Texto|Text|Icon|Desactivado|Disabled)/i.test(name)) {
      rule.minHeight = Math.max(rule.minHeight as number || 0, 44);
      rule.justifyContent = 'center';
    }
    if (/^(botonPrincipal|botonConfirmar|botonGuardar|botonRegistrar)$/.test(name)) rule.backgroundColor='#087f73';
    if (/^(input|textArea)/.test(name)) { rule.fontSize = 16; rule.minHeight = 46; rule.minWidth = 0; }
    if (/^(hero|header|accionesFila|tablaFooter|tituloFila)$/.test(name)) { rule.flexWrap = 'wrap'; rule.gap = 12; }
    result[name] = rule;
  }
  return StyleSheet.create(result) as T;
}

export function useAppStyles<T extends StyleSheet.NamedStyles<T>>(base: T): T {
  const phone = useWindowDimensions().width < 768;
  return useMemo(() => {
    if (!phone) return base;
    const result = { ...base };
    for (const [name, original] of Object.entries(base)) {
      const rule = { ...(original as Rule) };
      if (/^(titulo|title|tituloSeccion|logoNombre)$/.test(name)) rule.fontSize = Math.min(rule.fontSize || 26, 28);
      if (/^(formFila|filaFormulario|filaInputs|filaCampos|formRow|inputsFila|accionesFila|tablaFooter)$/.test(name)) {
        rule.flexDirection = 'column'; rule.alignItems = 'stretch'; rule.gap = 12;
      }
      if (/^(card|formulario|formCard|tablaCaja|contenedor|contenedorPrincipal)$/.test(name)) {
        rule.padding = 16; rule.minWidth = 0; rule.maxWidth = '100%';
      }
      if (/^(header|hero)$/.test(name)) { rule.flexDirection = 'column'; rule.alignItems = 'stretch'; }
      if (/^(input|textArea)/.test(name)) rule.minWidth = 0;
      if (name === 'tarjetasTelefono') { rule.flexDirection='row'; rule.flexWrap='wrap'; }
      if (name === 'tarjeta') { rule.minWidth=120; rule.flexBasis='45%'; rule.flexGrow=1; rule.padding=14; }
      if (/^tarjetaIcono/.test(name)) rule.display='none';
      if (name === 'contenedorPrincipal') rule.padding=0;
      if (name === 'bannerTitulo') rule.fontSize=28;
      if (/^(catalogoContenido|filtros|seccionProductos)$/.test(name)) rule.paddingHorizontal=16;
      (result as any)[name] = rule;
    }
    return result;
  }, [base, phone]);
}
