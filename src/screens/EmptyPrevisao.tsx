import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { BottomTabBar } from '../components/BottomTabBar';
import { nextMonth } from '../utils/dates';

export function EmptyPrevisao() {
  return (
    <div className="phone-surface" style={{height:'100%',position:'relative'}} data-screen-label="Empty Forecast">
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:10}}><IOSStatusBar/></div>
      <div style={{position:'absolute',top:0,left:0,right:0,bottom:100,overflow:'auto',paddingTop:54,paddingBottom:20}} className="no-scrollbar">
        <div style={{padding:'8px 16px 14px'}}>
          <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)',letterSpacing:1.2,textTransform:'uppercase'}}>PRÓXIMO MÊS</div>
          <h1 style={{fontSize:26,fontWeight:600,letterSpacing:-0.6,margin:0,color:'var(--text-1)'}}>{nextMonth()}</h1>
        </div>
        <div style={{margin:'0 16px 14px',padding:'24px 20px',background:'var(--bg-1)',border:'1px solid var(--border-1)',borderRadius:'var(--r-card)'}}>
          <Icons.trending size={28} color="var(--text-3)"/>
          <h2 style={{fontSize:18,fontWeight:600,margin:'14px 0 6px',color:'var(--text-1)',letterSpacing:-0.3}}>Dados insuficientes para previsão</h2>
          <p style={{fontSize:13,color:'var(--text-3)',lineHeight:1.5,margin:0}}>A previsão usa a média dos últimos 3 meses por categoria. Continue adicionando transações para habilitar esta funcionalidade.</p>
        </div>
      </div>
      <BottomTabBar active="forecast"/>
    </div>
  );
}
