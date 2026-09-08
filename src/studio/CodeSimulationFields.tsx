import type { CodeSimulationOptions } from '../types';

export function CodeSimulationFields({ value, onChange }: {
  value: CodeSimulationOptions;
  onChange: (options: CodeSimulationOptions) => void;
}) {
  return <div className="code-simulation-fields">
    <button type="button" className="secondary-button full-width" aria-pressed={Boolean(value.simulationEnabled)}
      onClick={() => onChange({ simulationEnabled: !value.simulationEnabled })}>
      {value.simulationEnabled ? 'Desactivar simulación' : 'Activar simulación de código'}
    </button>
    {value.simulationEnabled && <label>Salida de la simulación
      <textarea className="mono-input" rows={5} placeholder="hola" value={value.simulationOutput ?? ''}
        onChange={event => onChange({ simulationOutput: event.target.value })} />
      <small>Run code mostrará este texto en una terminal. El código no se ejecuta.</small>
    </label>}
  </div>;
}
