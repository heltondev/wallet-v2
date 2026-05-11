import { Icons } from '../components/icons/Icons';
import { CATS } from '../data/categories';
import { fmtBRL, fmtUSD } from '../utils/formatters';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { BarChart } from '../components/BarChart';
import { CategoryIcon } from '../components/CategoryIcon';
import type { FabKind } from '../types';

interface PrevisaoAProps {
  fabKind?: FabKind;
}

export function PrevisaoA({ fabKind: _fabKind = 'circle' }: PrevisaoAProps) {
  const data = [
    {label:'DEZ', value:3200},
    {label:'JAN', value:3850},
    {label:'FEV', value:2900},
    {label:'MAR', value:4100},
    {label:'ABR', value:3812},
    {label:'MAI', value:4287},
    {label:'JUN', value:4520, forecast:true},
  ];
  return (
    <div className="phone-surface" style={{height:'100%',position:'relative'}} data-screen-label="Forecast A">
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:10}}><IOSStatusBar/></div>
      <div style={{position:'absolute',top:0,left:0,right:0,bottom:80,overflow:'auto',paddingTop:54,paddingBottom:20}} className="no-scrollbar">
        <div style={{padding:'8px 16px 16px'}}>
          <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)',letterSpacing:1.2,textTransform:'uppercase',marginBottom:4}}>PREVISÃO PARA</div>
          <h1 style={{fontSize:28,fontWeight:600,letterSpacing:-0.8,margin:0,color:'var(--text-1)'}}>Junho · 2026</h1>
        </div>

        <div style={{margin:'0 16px 14px',background:'var(--bg-1)',border:'1px solid var(--border-1)',borderRadius:'var(--r-card)',padding:'18px 18px 20px'}}>
          <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)',letterSpacing:0.8,textTransform:'uppercase',marginBottom:4}}>Sobra projetada</div>
          <div className="money" style={{fontSize:42,fontWeight:600,letterSpacing:-1.8,lineHeight:1,color:'var(--pos)'}}>{fmtBRL(4520,{decimals:0})}</div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
            <span className="money" style={{fontSize:11,color:'var(--pos)',fontFamily:'var(--font-mono)',fontWeight:500,display:'flex',alignItems:'center',gap:2}}>
              <Icons.arrowUp size={11} stroke={2.4}/>+5.4% vs mai
            </span>
            <span style={{width:3,height:3,borderRadius:'50%',background:'var(--text-4)'}}/>
            <span className="money" style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)'}}>≈ {fmtUSD(4520,{decimals:0})}</span>
          </div>
          <div style={{height:1,background:'var(--border-1)',margin:'16px -18px 14px'}}/>
          <BarChart data={data} height={110}/>
          <div style={{display:'flex',gap:14,justifyContent:'center',marginTop:10,fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-3)',letterSpacing:0.5}}>
            <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,background:'var(--text-1)',borderRadius:2}}/>REALIZADO</span>
            <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,border:'1.5px dashed var(--pos)',borderRadius:2}}/>PROJEÇÃO</span>
          </div>
        </div>

        <div style={{padding:'4px 16px 6px',display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
          <h3 style={{fontSize:13,fontWeight:600,color:'var(--text-2)',margin:0,letterSpacing:0.5,textTransform:'uppercase',fontFamily:'var(--font-mono)'}}>Recorrentes confirmadas</h3>
          <span style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)'}}>5 itens</span>
        </div>
        <div style={{margin:'4px 16px 14px',background:'var(--bg-1)',border:'1px solid var(--border-1)',borderRadius:'var(--r-card-sm)'}}>
          {[
            {desc:'Salário · Maio',cat:'salario',amount:11800,on:true},
            {desc:'Aluguel',cat:'casa',amount:-2400,on:true},
            {desc:'Netflix',cat:'assinaturas',amount:-55.9,on:true},
            {desc:'Spotify Family',cat:'assinaturas',amount:-26.9,on:true},
            {desc:'Plano de Saúde',cat:'saude',amount:-487.30,on:false},
          ].map((rec,idx,arr)=>(
            <div key={idx} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom: idx<arr.length-1?'1px solid var(--border-1)':'none',opacity: rec.on?1:0.45}}>
              <CategoryIcon cat={rec.cat} size={28} radius={8}/>
              <div style={{flex:1,fontSize:13.5,color:'var(--text-1)',fontWeight:500}}>{rec.desc}</div>
              <span className="money" style={{fontSize:13,fontWeight:600,color: rec.amount>0?'var(--pos)':'var(--text-1)'}}>
                {rec.amount>0?'+':'−'}{fmtBRL(Math.abs(rec.amount),{decimals:0}).replace('−','')}
              </span>
              <div style={{
                width:34,height:20,borderRadius:10,
                background: rec.on?'var(--pos)':'var(--bg-3)',position:'relative',transition:'background .15s',
              }}>
                <div style={{
                  position:'absolute',top:2,left: rec.on?16:2,
                  width:16,height:16,borderRadius:8,background:'#fff',transition:'left .15s',
                }}/>
              </div>
            </div>
          ))}
        </div>

        <div style={{padding:'4px 16px 6px'}}>
          <h3 style={{fontSize:13,fontWeight:600,color:'var(--text-2)',margin:0,letterSpacing:0.5,textTransform:'uppercase',fontFamily:'var(--font-mono)'}}>Baseado no histórico · 3 meses</h3>
        </div>
        <div style={{margin:'4px 16px 14px',background:'var(--bg-1)',border:'1px solid var(--border-1)',borderRadius:'var(--r-card-sm)'}}>
          {[
            {cat:'mercado',amount:920},
            {cat:'restaurante',amount:480},
            {cat:'transporte',amount:540},
            {cat:'lazer',amount:280},
          ].map((rec,idx,arr)=>(
            <div key={rec.cat} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom: idx<arr.length-1?'1px solid var(--border-1)':'none'}}>
              <CategoryIcon cat={rec.cat} size={28} radius={8}/>
              <div style={{flex:1,fontSize:13.5,color:'var(--text-1)',fontWeight:500}}>{CATS[rec.cat].label}</div>
              <span className="money" style={{fontSize:13,color:'var(--text-3)',fontFamily:'var(--font-mono)'}}>média</span>
              <span className="money" style={{fontSize:13,fontWeight:600,color:'var(--text-1)',minWidth:80,textAlign:'right'}}>−{fmtBRL(rec.amount,{decimals:0}).replace('−','')}</span>
              <Icons.pencil size={14} color="var(--text-4)"/>
            </div>
          ))}
        </div>

        <div style={{padding:'4px 16px 20px'}}>
          <button style={{
            width:'100%',padding:'13px 0',
            background:'transparent',border:'1px solid var(--border-2)',color:'var(--text-1)',
            borderRadius:'var(--r-input)',fontSize:14,fontWeight:500,fontFamily:'var(--font-sans)',cursor:'pointer',
          }}>Ajustar previsão por categoria →</button>
        </div>
      </div>
    </div>
  );
}
