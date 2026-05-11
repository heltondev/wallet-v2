import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { BottomTabBar } from '../components/BottomTabBar';
import type { FabKind } from '../types';

interface RowProps {
  label: string;
  detail?: string;
  icon?: string;
  last?: boolean;
  danger?: boolean;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

interface AjustesScreenProps {
  fabKind?: FabKind;
  onNavigate?: (screen: string) => void;
}

export function AjustesScreen({ fabKind = 'circle', onNavigate }: AjustesScreenProps) {
  const Row = ({ label, detail, icon, last, danger }: RowProps) => {
    const Ic = icon ? (Icons as Record<string, React.ComponentType<{ size?: number; color?: string; stroke?: number }>>)[icon] : null;
    return (
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderBottom: last?'none':'1px solid var(--border-1)'}}>
        {Ic && <Ic size={17} color={danger?'var(--neg)':'var(--text-2)'} stroke={1.8}/>}
        <span style={{flex:1,fontSize:14.5,color: danger?'var(--neg)':'var(--text-1)',fontWeight:500}}>{label}</span>
        {detail && <span style={{fontSize:13,color:'var(--text-3)',fontFamily:'var(--font-mono)'}}>{detail}</span>}
        <Icons.chevR size={14} color="var(--text-4)"/>
      </div>
    );
  };
  const Section = ({ title, children }: SectionProps) => (
    <div style={{marginBottom:18}}>
      <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)',letterSpacing:1,textTransform:'uppercase',padding:'0 16px 6px'}}>{title}</div>
      <div style={{margin:'0 16px',background:'var(--bg-1)',border:'1px solid var(--border-1)',borderRadius:'var(--r-card-sm)',overflow:'hidden'}}>{children}</div>
    </div>
  );
  return (
    <div className="phone-surface" style={{height:'100%',position:'relative',overflow:'hidden'}} data-screen-label="Settings">
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:10}}><IOSStatusBar/></div>
      <div style={{height:'100%',overflow:'auto',paddingTop:54,paddingBottom:90}} className="no-scrollbar">
        <div style={{padding:'8px 16px 18px'}}>
          <h1 style={{fontSize:24,fontWeight:600,letterSpacing:-0.6,margin:0,color:'var(--text-1)'}}>Ajustes</h1>
        </div>
        {/* profile */}
        <div style={{margin:'0 16px 18px',padding:'14px 16px',background:'var(--bg-1)',border:'1px solid var(--border-1)',borderRadius:'var(--r-card-sm)',display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:42,height:42,borderRadius:21,background:'var(--bg-3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:600,color:'var(--text-1)',fontFamily:'var(--font-sans)'}}>RC</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14.5,fontWeight:600,color:'var(--text-1)'}}>Rafael Carvalho</div>
            <div style={{fontSize:12,color:'var(--text-3)',fontFamily:'var(--font-mono)'}}>rafael@email.com</div>
          </div>
          <Icons.chevR size={14} color="var(--text-4)"/>
        </div>
        <Section title="CONTA">
          <Row label="Carteiras e contas" detail="3" icon="wallet"/>
          <Row label="Categorias" detail="9" icon="grid"/>
          <Row label="Orçamento mensal" detail="R$ 9.500" icon="trending" last/>
        </Section>
        <Section title="APARÊNCIA">
          <Row label="Tema" detail="Sistema" icon="moon"/>
          <Row label="Moeda principal" detail="BRL" last/>
        </Section>
        <Section title="DADOS">
          <Row label="Exportar (CSV / OFX)" icon="download"/>
          <Row label="Backup automático" detail="Ativo" icon="cloud" last/>
        </Section>
        <Section title="INTELIGÊNCIA ARTIFICIAL">
          <div onClick={() => onNavigate?.('ai-chat')} style={{cursor:'pointer'}}>
            <Row label="Assistente financeiro" detail="Chat" icon="alert"/>
          </div>
          <div onClick={() => onNavigate?.('ai-insights')} style={{cursor:'pointer'}}>
            <Row label="Insights do mês" icon="trending"/>
          </div>
          <div onClick={() => onNavigate?.('ai-receipt')} style={{cursor:'pointer'}}>
            <Row label="Escanear recibo" icon="search" last/>
          </div>
        </Section>
        <Section title="ADMIN">
          <div onClick={() => onNavigate?.('admin-costs')} style={{cursor:'pointer'}}>
            <Row label="Custos de infraestrutura" icon="trending" last/>
          </div>
        </Section>
        <Section title="SUPORTE">
          <Row label="Sobre" last/>
        </Section>
      </div>
      <BottomTabBar active="settings" fabKind={fabKind}/>
    </div>
  );
}
