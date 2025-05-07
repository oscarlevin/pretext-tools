
import './App.css';
//import './theme-denver.css';
import './styles.scss';
import VisualEditor from './components/VisualEditor';


function App() {
  return (
    <div className="ptx-page">
      <main className="ptx-main">
        <div className="ptx-content">
          <VisualEditor />
        </div>
      </main>
    </div>
  )
}

export default App
