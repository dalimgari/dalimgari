export default function SearchSuggestions({
  id,
  label,
  suggestions,
  emptyMessage,
  renderOption,
  onSelect,
}) {
  return (
    <div id={id} role="listbox" aria-label={label} style={{ display: 'grid', gap: '.45rem', marginTop: '.65rem' }}>
      {suggestions.length ? suggestions.map((item) => (
        <button
          key={item.key}
          type="button"
          role="option"
          className="ui-button ui-button--secondary"
          onClick={() => onSelect(item)}
          style={{ display: 'grid', gridTemplateColumns: 'minmax(7rem,1fr) minmax(7rem,1fr)', gap: '.65rem', textAlign: 'left', alignItems: 'center' }}
        >
          {renderOption(item)}
        </button>
      )) : <div className="ui-empty">{emptyMessage}</div>}
    </div>
  )
}
