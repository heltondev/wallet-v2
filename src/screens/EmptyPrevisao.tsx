import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { BottomTabBar } from '../components/BottomTabBar';
import { nextMonth } from '../utils/dates';
import './EmptyPrevisao.scss';

export function EmptyPrevisao() {
  return (
    <div className="phone-surface empty-previsao" data-screen-label="Empty Forecast">
      <div className="empty-previsao__status-bar"><IOSStatusBar/></div>
      <div className="empty-previsao__scroll no-scrollbar">
        <div className="empty-previsao__header">
          <div className="empty-previsao__label">PRÓXIMO MÊS</div>
          <h1 className="empty-previsao__title">{nextMonth()}</h1>
        </div>
        <div className="empty-previsao__card">
          <Icons.trending size={28} color="var(--text-3)"/>
          <h2 className="empty-previsao__card-title">Dados insuficientes para previsão</h2>
          <p className="empty-previsao__card-desc">A previsão usa a média dos últimos 3 meses por categoria. Continue adicionando transações para habilitar esta funcionalidade.</p>
        </div>
      </div>
      <BottomTabBar active="forecast"/>
    </div>
  );
}
