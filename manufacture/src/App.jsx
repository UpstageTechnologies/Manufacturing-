import { BrowserRouter } from 'react-router-dom';
import RootNavigator from './Navigation/RootNavigator';
import './Styles/Global.css';
import './Styles/Typography.css';
import './Styles/Layout.css';
import './Styles/Responsive.css';

function App() {
  return (
    <BrowserRouter>
      <RootNavigator />
    </BrowserRouter>
  );
}

export default App;
