import { BrowserRouter } from 'react-router-dom';
import RootNavigator from './Navigation/RootNavigator';
import { ERPProvider } from './State/ERPContext';
import './Styles/Global.css';
import './Styles/Typography.css';
import './Styles/Layout.css';
import './Styles/Responsive.css';

function App() {
  return (
    <BrowserRouter>
      <ERPProvider>
        <RootNavigator />
      </ERPProvider>
    </BrowserRouter>
  );
}

export default App;
