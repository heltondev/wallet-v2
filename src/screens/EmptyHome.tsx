import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { BottomTabBar } from '../components/BottomTabBar';
import { currentMonth, currentYear } from '../utils/dates';
import './EmptyHome.scss';

interface EmptyHomeProps {
  userName?: string;
}

export function EmptyHome({ userName }: EmptyHomeProps) {
  const greeting = userName ? `Olá, ${userName}` : 'Olá';
  return (
    <div className="phone-surface empty-home" data-screen-label="Empty Home">
      <div className="empty-home__status-bar"><IOSStatusBar/></div>
      <div className="empty-home__body">
        <div>
          <div className="empty-home__month">{currentMonth()} · {currentYear()}</div>
          <h1 className="empty-home__greeting">{greeting}</h1>
        </div>
        <div className="empty-home__center">
          <div className="empty-home__balance-card">
            <div className="money empty-home__balance-amount">R$ 0,00</div>
            <div className="empty-home__balance-label">Saldo do mês</div>
          </div>
          <div>
            <h2 className="empty-home__empty-title">Sem transações ainda</h2>
            <p className="empty-home__empty-desc">Adicione sua primeira transação para começar a ver seu saldo, orçamento e previsão.</p>
          </div>
        </div>
        <button className="empty-home__add-btn">
          <Icons.plus size={18} stroke={2.4} color="var(--bg-0)"/>
          Adicionar primeira transação
        </button>
      </div>
      <BottomTabBar active="home"/>
    </div>
  );
}
