import { useEffect, useState } from 'react'
import { appPath } from '../../lib/routes'
import { getSidebarSettings } from '../../services/sidebarService'
import { listPublishedPages } from '../../services/pageService'
import { usePreferences } from '../../context/PreferencesContext'

function RuralIcon({ name }) { const shapes={home:<><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9 20v-5h6v5"/></>,info:<><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></>,post:<><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,album:<><path d="M4 6h16v14H4z"/><path d="m7 17 4-4 3 3 2-2 3 3"/><circle cx="9" cy="10" r="1"/></>,user:<><circle cx="12" cy="8" r="3"/><path d="M5 20c.8-3.4 3.1-5 7-5s6.2 1.6 7 5"/></>,leaf:<><path d="M20 4C11 4 5 8 5 15c0 3 2 5 5 5 7 0 10-6 10-16Z"/><path d="M5 20c2-5 6-8 11-10"/></>,sun:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4-1.4"/></>,moon:<path d="M20 15.5A8.5 8.5 0 1 0 20 15.5Z"/>}; return <svg className="rural-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--theme-icon-stroke-width,1.7)" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg> }

export default function Sidebar({items=[],open,onClose,labels={},canonicalPath='/'}){
  const { theme, language, setThemePreference, setLanguagePreference } = usePreferences()
  function toggleTheme(){ setThemePreference(theme === 'dark' ? 'light' : 'dark') }
  const targetLanguageLabel = language === 'bng' ? 'English' : 'বাংলা'

  return <><button data-no-translate="true" className={'rural-sidebar__backdrop'+(open?' is-visible':'')} aria-label="উঠান বন্ধ করুন" onClick={onClose}/><aside className={'rural-sidebar'+(open?' is-open':'')} aria-label="গ্রামের উঠান"><div className="rural-sidebar__tools"><button type="button" onClick={toggleTheme}><RuralIcon name={theme==='dark'?'sun':'moon'}/><span>{theme==='dark'?'দিনের আলো':'রাতের আবহ'}</span></button><button data-no-translate="true" type="button" aria-label={targetLanguageLabel} onClick={()=>setLanguagePreference(language==='bng'?'eng':'bng')}><RuralIcon name="leaf"/><span>{targetLanguageLabel}</span></button></div></aside></>
}
