import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const img = (path, size = "w500") => path ? `https://image.tmdb.org/t/p/${size}${path}` : "";
const title = item => item?.title || item?.name || "제목 없음";
const Icon = ({name}) => name === "search" ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c.4-4 3.3-6 8-6s7.6 2 8 6"/></svg>;
function Hero({items, onSelect}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const touchStart = useRef(null);
  const move = direction => setIndex(i => (i + direction + items.length) % items.length);

  useEffect(() => {
    if (items.length < 2 || paused || interacting) return;
    const timer = setTimeout(() => setIndex(i => (i + 1) % items.length), 7000);
    return () => clearTimeout(timer);
  }, [index, items.length, paused, interacting]);

  return <section className="hero" aria-label="추천 콘텐츠" aria-roledescription="캐러셀"
    onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
    onFocus={() => setInteracting(true)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setInteracting(false); }}
    onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); } }}
    onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
    onTouchEnd={e => { if (touchStart.current !== null) { const distance = e.changedTouches[0].clientX - touchStart.current; if (Math.abs(distance) > 50 && items.length > 1) move(distance > 0 ? -1 : 1); touchStart.current = null; } }}>
    {items.map((item, i) => <div key={`${item.media_type}-${item.id}`} className={`hero-slide ${i === index ? 'active' : ''}`} aria-hidden={i !== index} style={{backgroundImage: `linear-gradient(90deg, #101010 0%, rgba(16,16,16,.8) 17%, rgba(16,16,16,.1) 65%), linear-gradient(0deg, #101010 0%, transparent 40%), url(${img(item.backdrop_path,'original')})`}} />)}
    <div className="hero-copy" key={items[index]?.id}>
      <p className="eyebrow">ONLY THE BEST STORIES</p><div className="hero-mark">TVING <span>추천</span></div>
      <h1>{items[index] ? title(items[index]) : '즐거움을 스트리밍'}</h1>
      <p className="description">{items[index]?.overview || '지금 가장 주목받는 이야기들을 만나보세요.'}</p>
      <button className="hero-button" disabled={!items[index]} onClick={() => onSelect(items[index])}>자세히 보기 <span aria-hidden="true">›</span></button>
    </div>
    {items.length > 1 && <div className="hero-controls" role="group" aria-label="추천 콘텐츠 탐색">
      <button className="hero-arrow" aria-label="이전 배너" onClick={() => move(-1)}><span aria-hidden="true">‹</span></button>
      <span className="hero-count">{String(index+1).padStart(2,'0')} <i>/</i> {String(items.length).padStart(2,'0')}</span>
      <button className="hero-arrow" aria-label="다음 배너" onClick={() => move(1)}><span aria-hidden="true">›</span></button>
      <div className="hero-dots">{items.map((item, i) => <button key={`${item.media_type}-${item.id}`} className={i === index ? 'active' : ''} aria-label={`${i+1}번 배너: ${title(item)}`} aria-current={i === index ? 'true' : undefined} onClick={() => setIndex(i)} />)}</div>
      <button className="hero-pause" aria-label={paused ? '자동 전환 재생' : '자동 전환 일시정지'} onClick={() => setPaused(value => !value)}>{paused ? '▶' : 'Ⅱ'}</button>
    </div>}
  </section>;
}
function Row({heading, items = [], ranked = false, onSelect}) {
  const valid = items.filter(item => item.poster_path && (item.title || item.name) && item.media_type !== 'person');
  if (!valid.length) return null;
  return <section className="row"><div className="row-head"><h2>{heading}</h2><span>전체보기　?</span></div><div className="cards">{valid.slice(0, 12).map((item, i) => <button className={'card ' + (ranked ? 'ranked' : '')} key={`${item.id}-${i}`} onClick={() => onSelect(item)}>{ranked && <strong className="rank">{i+1}</strong>}<img src={img(item.poster_path)} alt="" loading="lazy"/><span>{title(item)}</span></button>)}</div></section>;
}
function Details({item, onClose, onSelect}) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const type = item.media_type || (item.title ? 'movie' : 'tv');
  useEffect(() => {
    const controller = new AbortController();
    setDetail(null); setError('');
    fetch(`/api/details/${type}/${item.id}`, {signal: controller.signal})
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.detail); setDetail(data); })
      .catch(err => { if (err.name !== 'AbortError') setError(err.message || '상세 정보를 불러오지 못했습니다.'); });
    return () => controller.abort();
  }, [type, item.id]);
  useEffect(() => {
    const close = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);
  const work = detail || item;
  const trailer = detail?.videos?.results?.find(video => video.site === 'YouTube' && video.type === 'Trailer');
  const cast = detail?.credits?.cast?.slice(0, 8) || [];
  const directors = detail?.credits?.crew?.filter(person => person.job === 'Director').map(person => person.name).slice(0, 3) || [];
  const recommendations = detail?.recommendations?.results?.filter(result => result.poster_path).slice(0, 6) || [];
  return <div className="overlay" onClick={onClose}><div className="modal detail-modal" role="dialog" aria-modal="true" aria-label={`${title(work)} 상세 정보`} onClick={e => e.stopPropagation()}>
    <button className="close" onClick={onClose} aria-label="닫기">×</button>
    <div className="detail-visual" style={work.backdrop_path ? {backgroundImage: `linear-gradient(0deg,#171717 0%,transparent 70%),url(${img(work.backdrop_path,'w1280')})`} : undefined} />
    <div className="detail-content"><div className="detail-label">TVING <span>콘텐츠 정보</span></div><h2>{title(work)}</h2>
      <div className="detail-meta"><span>{(work.release_date || work.first_air_date || '').slice(0,4)}</span>{work.vote_average > 0 && <span>★ {work.vote_average.toFixed(1)} <small>({work.vote_count?.toLocaleString()}명)</small></span>}{work.runtime > 0 && <span>{work.runtime}분</span>}{work.number_of_seasons > 0 && <span>시즌 {work.number_of_seasons}개</span>}{work.genres?.map(genre => <span key={genre.id}>{genre.name}</span>)}</div>
      {trailer && <a className="trailer-link" href={`https://www.youtube.com/watch?v=${encodeURIComponent(trailer.key)}`} target="_blank" rel="noreferrer">▶ 예고편 보기</a>}
      <p className="detail-overview">{work.overview || '줄거리 정보가 없습니다.'}</p>
      {error && <p className="detail-status" role="alert">{error}</p>}{!detail && !error && <p className="detail-status">상세 정보를 불러오는 중입니다.</p>}
      {detail && <><div className="detail-facts">{directors.length > 0 && <p><span>감독</span> {directors.join(', ')}</p>}{cast.length > 0 && <p><span>출연</span> {cast.map(person => person.name).join(', ')}</p>}{(work.original_title || work.original_name) && <p><span>원제</span> {work.original_title || work.original_name}</p>}</div>
      {cast.length > 0 && <section className="detail-section"><h3>출연진</h3><div className="cast-list">{cast.map(person => <div className="cast-person" key={person.id}>{person.profile_path ? <img src={img(person.profile_path,'w185')} alt="" loading="lazy"/> : <div className="cast-placeholder">●</div>}<strong>{person.name}</strong><span>{person.character}</span></div>)}</div></section>}
      {recommendations.length > 0 && <section className="detail-section"><h3>비슷한 콘텐츠</h3><div className="detail-recommendations">{recommendations.map(result => <button key={result.id} onClick={() => onSelect({...result, media_type: result.media_type || type})}><img src={img(result.poster_path,'w342')} alt="" loading="lazy"/><span>{title(result)}</span></button>)}</div></section>}</>}
    </div>
  </div></div>;
}
function App(){
 const [data,setData]=useState(null), [error,setError]=useState(''), [search,setSearch]=useState(false), [query,setQuery]=useState(''), [results,setResults]=useState(null), [selected,setSelected]=useState(null);
 useEffect(()=>{fetch('/api/home').then(async r=>{const json=await r.json(); if(!r.ok) throw Error(json.detail); setData(json)}).catch(e=>setError(e.message || '데이터를 불러오지 못했습니다.'));},[]);
 const heroes=(data?.trending || []).filter(x=>x.backdrop_path && ['movie','tv'].includes(x.media_type)).slice(0,5);
 useEffect(()=>{if(!query.trim()){setResults(null);return} const timer=setTimeout(()=>fetch(`/api/search?q=${encodeURIComponent(query.trim())}`).then(r=>r.json()).then(d=>setResults((d.results || []).filter(item => item.poster_path && item.media_type !== 'person'))).catch(()=>setResults([])),350);return()=>clearTimeout(timer)},[query]);
 return <><header><a href="/" className="logo" aria-label="TVING 홈">TVING</a><nav><a href="#drama">드라마</a><a href="#entertainment">예능</a><a href="#movies">영화</a><a href="#popular">인기</a></nav><div className="header-actions"><button className="header-icon" aria-label="검색" aria-expanded={search} onClick={()=>setSearch(!search)}><Icon name="search"/></button><button className="header-icon profile-icon" aria-label="프로필" onClick={()=>alert('로그인 기능은 제공되지 않습니다.')}><Icon name="user"/></button></div></header>
 {search && <div className="search"><input autoFocus placeholder="제목을 검색해 보세요" value={query} onChange={e=>setQuery(e.target.value)}/><button onClick={()=>{setSearch(false);setQuery('')}}>닫기</button></div>}
 {results ? <main className="search-results"><h2>‘{query}’ 검색 결과</h2>{results.length ? <div className="result-grid">{results.filter(x=>x.poster_path && x.media_type !== 'person').map(item=><button className="card" key={`${item.media_type}-${item.id}`} onClick={()=>setSelected(item)}><img src={img(item.poster_path)} alt=""/><span>{title(item)}</span></button>)}</div> : <p>검색 결과가 없습니다.</p>}</main> : <><Hero items={heroes} onSelect={setSelected}/><main className="content">{error && <div className="notice"><b>콘텐츠를 불러올 수 없습니다</b><p>{error}</p></div>}{!data && !error && <div className="notice">콘텐츠를 불러오는 중입니다.</div>}<div id="popular"><Row heading="지금 가장 핫한 콘텐츠" items={data?.trending} ranked onSelect={setSelected}/></div><div id="movies"><Row heading="놓치면 아쉬운 최신 영화" items={data?.movies} onSelect={setSelected}/></div><div id="drama"><Row heading="계속 보고 싶은 인기 시리즈" items={data?.tv} onSelect={setSelected}/></div><div id="entertainment"><Row heading="오늘 뭐 볼지 고민된다면" items={data?.popular} onSelect={setSelected}/></div></main></>}
 <footer><div className="footer-links">고객센터　 |　 이용약관　 |　 개인정보처리방침　 |　 청소년 보호정책</div><p>이 서비스는 TMDB의 데이터와 이미지를 사용하지만 TMDB의 인증 또는 보증을 받지 않았습니다.</p><p>ⓒ 2026 TVING UI PROJECT. Data provided by TMDB.</p></footer>
 {selected && <Details item={selected} onClose={()=>setSelected(null)} onSelect={setSelected}/>}</>;
}

createRoot(document.getElementById('root')).render(<App/>);

