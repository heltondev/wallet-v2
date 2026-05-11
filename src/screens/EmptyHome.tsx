import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { BottomTabBar } from '../components/BottomTabBar';

export function EmptyHome() {
  return (
    <div className="phone-surface" style={{height:'100%',position:'relative'}} data-screen-label="Empty Home">
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:10}}><IOSStatusBar/></div>
      <div style={{height:'100%',padding:'80px 24px 90px',display:'flex',flexDirection:'column'}}>
        <div>
          <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)',letterSpacing:1.2,textTransform:'uppercase'}}>Maio · 2026</div>
          <h1 style={{fontSize:30,fontWeight:600,letterSpacing:-0.8,margin:'2px 0 0',color:'var(--text-1)'}}>Olá, Rafael</h1>
        </div>
        <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'flex-start',gap:24}}>
          <div style={{
            border:'1.5px dashed var(--border-2)',borderRadius:'var(--r-card)',
            padding:'28px 24px',width:'100%',boxSizing:'border-box',
          }}>
            <div className="money" style={{fontSize:60,fontWeight:600,letterSpacing:-2.8,color:'var(--text-4)',lineHeight:1}}>R$ 0,00</div>
            <div style={{fontSize:13,color:'var(--text-3)',fontFamily:'var(--font-mono)',marginTop:6,textTransform:'uppercase',letterSpacing:0.5}}>Saldo do mês</div>
          </div>
          <div>
            <h2 style={{fontSize:22,fontWeight:600,margin:'0 0 6px',letterSpacing:-0.5,color:'var(--text-1)'}}>Sem transações ainda</h2>
            <p style={{fontSize:14,color:'var(--text-3)',lineHeight:1.45,margin:0,maxWidth:300}}>Adicione sua primeira transação para começar a ver seu saldo, orçamento e previsão.</p>
          </div>
        </div>
        <button style={{
          padding:'16px 0',background:'var(--text-1)',color:'var(--bg-0)',border:'none',
          borderRadius:'var(--r-input)',fontFamily:'var(--font-sans)',fontWeight:600,fontSize:15,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',gap:8,
        }}>
          <Icons.plus size={18} stroke={2.4} color="var(--bg-0)"/>
          Adicionar primeira transação
        </button>
      </div>
      <BottomTabBar active="home"/>
    </div>
  );
}
