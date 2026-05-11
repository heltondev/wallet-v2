import { Icons } from '../components/icons/Icons';
import { fmtBRL } from '../utils/formatters';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { BottomTabBar } from '../components/BottomTabBar';

export function EmptyPrevisao() {
  return (
    <div className="phone-surface" style={{height:'100%',position:'relative'}} data-screen-label="Empty Forecast">
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:10}}><IOSStatusBar/></div>
      <div style={{position:'absolute',top:0,left:0,right:0,bottom:80,overflow:'auto',paddingTop:54,paddingBottom:20}} className="no-scrollbar">
        <div style={{padding:'8px 16px 14px'}}>
          <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)',letterSpacing:1.2,textTransform:'uppercase'}}>PRÓXIMO MÊS</div>
          <h1 style={{fontSize:26,fontWeight:600,letterSpacing:-0.6,margin:0,color:'var(--text-1)'}}>Junho 2026</h1>
        </div>
        <div style={{margin:'0 16px 14px',padding:'24px 20px',background:'var(--bg-1)',border:'1px solid var(--border-1)',borderRadius:'var(--r-card)'}}>
          <Icons.trending size={28} color="var(--text-3)"/>
          <h2 style={{fontSize:18,fontWeight:600,margin:'14px 0 6px',color:'var(--text-1)',letterSpacing:-0.3}}>Mais 1 mês para previsão completa</h2>
          <p style={{fontSize:13,color:'var(--text-3)',lineHeight:1.5,margin:0}}>A previsão usa a média dos últimos 3 meses por categoria. Você tem 2 meses de histórico.</p>
        </div>
        <div style={{padding:'4px 16px 6px'}}>
          <h3 style={{fontSize:13,fontWeight:600,color:'var(--text-2)',margin:0,letterSpacing:0.5,textTransform:'uppercase',fontFamily:'var(--font-mono)'}}>Progresso · 2 de 3 meses</h3>
        </div>
        <div style={{margin:'4px 16px 14px',background:'var(--bg-1)',border:'1px solid var(--border-1)',borderRadius:'var(--r-card-sm)'}}>
          {[
            {month:'Março 2026',state:'complete' as const,sub:'48 transações'},
            {month:'Abril 2026',state:'complete' as const,sub:'52 transações'},
            {month:'Maio 2026',state:'pending' as const,sub:'10 dias para fechar'},
          ].map((rec,idx,arr)=>(
            <div key={rec.month} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderBottom:idx<arr.length-1?'1px solid var(--border-1)':'none'}}>
              <div style={{
                width:24,height:24,borderRadius:12,
                background: rec.state==='complete'?'var(--pos)':'transparent',
                border: rec.state==='complete'?'none':'1.5px dashed var(--border-2)',
                display:'flex',alignItems:'center',justifyContent:'center',
              }}>
                {rec.state==='complete' && <Icons.check size={13} stroke={3} color="#0A0A0A"/>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:500,color:'var(--text-1)'}}>{rec.month}</div>
                <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)'}}>{rec.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:'4px 16px'}}>
          <div style={{background:'var(--bg-1)',border:'1px solid var(--border-1)',borderRadius:'var(--r-card-sm)',padding:14}}>
            <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)',letterSpacing:0.8,textTransform:'uppercase',marginBottom:8}}>ESTIMATIVA INICIAL</div>
            <div className="money" style={{fontSize:28,fontWeight:600,color:'var(--text-1)',letterSpacing:-0.8}}>~{fmtBRL(3500,{decimals:0})}</div>
            <div style={{fontSize:12,color:'var(--text-3)',marginTop:4,lineHeight:1.45}}>Baseado em 2 meses. Precisão aumenta com mais dados.</div>
          </div>
        </div>
      </div>
      <BottomTabBar active="forecast"/>
    </div>
  );
}
