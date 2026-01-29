import { useLocation, Link } from 'react-router-dom';
import clsx from 'clsx';

export default function BottomNav() {
  const location = useLocation();
  const current = location.pathname;

  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = current === to;
    return (
      <Link
        to={to}
        className={clsx(
          "flex flex-col items-center gap-1 py-2 rounded-2xl transition-all active:scale-95",
          isActive ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50"
        )}
      >
        <Icon size={24} strokeWidth={1.5} className={isActive ? "text-slate-900" : "text-slate-400"} />
        <span className="text-xs font-semibold">{label}</span>
      </Link>
    );
  };

  const HomeGifIcon = () => (
    <img
      src="/home.gif"
      alt="Home"
      className="w-8 object-contain scale-[1.2] -mt-1 -mb-1 mr-1"
    />
  );
  const Group = () => (
    <img
      src="/group.gif"
      alt="Groups"
      className="w-8 object-contain scale-[1.6] -mt-1 -mb-1 mr-0.5"
    />
  );

  const Report = () => (
    <img
      src="/report.gif"
      alt="Report"
      className="w-7 object-contain scale-[1.2] -mb-1 mr-0.9"
    />
  );

  const User = () => (
    <img
      src="/user.gif"
      alt="User"
      className="w-7 object-contain scale-[1.2] -mb-1 mr-0.9"
    />
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-white/90 backdrop-blur border-t border-slate-200 pb-6">
      <div className="mx-auto w-full max-w-md px-4 py-2">
        <div className="grid grid-cols-5 items-end gap-2">
          <NavItem to="/" icon={HomeGifIcon} label="Home" />
          <NavItem to="/groups" icon={Group} label="Groups" />

          {/* Floating Action Button (FAB) Wrapper */}
          <div className="flex items-center justify-center">
            <Link
              to="/add-expense"
              className="h-14 w-14 -mt-8 rounded-3xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 active:scale-95 flex items-center justify-center transition-all"
            >
              <img
                src="/coin.gif"
                alt="Coins"
                className="w-6 object-contain scale-[1.6] -mt-1 -mb-1"
              />
            </Link>
          </div>

          <NavItem to="/report" icon={Report} label="Report" />
          <NavItem to="/profile" icon={User} label="Profile" />
        </div>
      </div>
    </div>
  );
}