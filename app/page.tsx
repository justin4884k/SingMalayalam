'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen, ChevronLeft, ChevronRight, Heart, Menu, Music2,
  Pause, Play, RotateCcw, Share2, Sparkles, Volume2, X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

type VoiceMode = 'male' | 'female';

const passages = [
  {
    id: 'psalm-23', book: 'സങ്കീർത്തനങ്ങൾ', chapter: '23', english: 'Psalms', mood: 'ആശ്വാസം', duration: 188,
    text: [
      'യഹോവ എന്റെ ഇടയനാകുന്നു; എനിക്കു മുട്ടുണ്ടാകയില്ല.',
      'പച്ചയായ പുല്പുറങ്ങളിൽ അവൻ എന്നെ കിടത്തുന്നു; സ്വസ്ഥതയുള്ള വെള്ളത്തിന്നരികത്തേക്കു എന്നെ നടത്തുന്നു.',
      'എന്റെ പ്രാണനെ അവൻ തണുപ്പിക്കുന്നു; തിരുനാമംനിമിത്തം എന്നെ നീതിപാതകളിൽ നടത്തുന്നു.',
    ],
  },
  {
    id: 'psalm-121', book: 'സങ്കീർത്തനങ്ങൾ', chapter: '121', english: 'Psalms', mood: 'സഹായം', duration: 164,
    text: [
      'ഞാൻ എന്റെ കണ്ണു പർവ്വതങ്ങളിലേക്കു ഉയർത്തുന്നു; എനിക്കു സഹായം എവിടെനിന്നു വരും?',
      'എന്റെ സഹായം ആകാശത്തെയും ഭൂമിയെയും ഉണ്ടാക്കിയ യഹോവയിങ്കൽനിന്നു വരുന്നു.',
    ],
  },
  {
    id: 'psalm-91', book: 'സങ്കീർത്തനങ്ങൾ', chapter: '91', english: 'Psalms', mood: 'അഭയം', duration: 196,
    text: [
      'അത്യുന്നതന്റെ മറവിൽ വസിക്കയും സർവ്വശക്തന്റെ നിഴലിൻ കീഴിൽ പാർക്കയും ചെയ്യുന്നവൻ',
      'യഹോവയെക്കുറിച്ചു: അവൻ എന്റെ സങ്കേതവും കോട്ടയും ഞാൻ ആശ്രയിക്കുന്ന എന്റെ ദൈവവും എന്നു പറയുന്നു.',
    ],
  },
  {
    id: 'john-3', book: 'യോഹന്നാൻ', chapter: '3', english: 'John', mood: 'സ്നേഹം', duration: 178,
    text: [
      'തന്റെ ഏകജാതനായ പുത്രനിൽ വിശ്വസിക്കുന്ന ഏവനും നശിച്ചുപോകാതെ നിത്യജീവൻ പ്രാപിക്കേണ്ടതിന്നു',
      'ദൈവം അവനെ നല്കുവാൻ തക്കവണ്ണം ലോകത്തെ സ്നേഹിച്ചു.',
    ],
  },
];

const melody = [261.63, 329.63, 392, 349.23, 329.63, 293.66, 261.63, 293.66, 329.63, 392, 440, 392, 349.23, 329.63, 293.66, 261.63];

function formatTime(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function WaveMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`wave-mark ${small ? 'wave-mark-small' : ''}`} aria-hidden="true">
      {[8, 15, 24, 18, 30, 21, 12].map((height, index) => <i key={`${height}-${index}`} style={{ height }} />)}
    </span>
  );
}

export default function Home() {
  const [passageIndex, setPassageIndex] = useState(0);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('male');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(58);
  const [showLibrary, setShowLibrary] = useState(false);
  const [liked, setLiked] = useState(false);
  const [shared, setShared] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const melodyTimerRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);

  const passage = passages[passageIndex];
  const fullText = useMemo(() => passage.text.join(' '), [passage]);

  const stopAudio = () => {
    window.speechSynthesis?.cancel();
    if (melodyTimerRef.current) window.clearInterval(melodyTimerRef.current);
    if (elapsedTimerRef.current) window.clearInterval(elapsedTimerRef.current);
    melodyTimerRef.current = null;
    elapsedTimerRef.current = null;
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
      gainRef.current = null;
    }
  };

  useEffect(() => () => stopAudio(), []);

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume / 280;
  }, [volume]);

  const playTone = (context: AudioContext, frequency: number, at: number) => {
    const oscillator = context.createOscillator();
    const noteGain = context.createGain();
    oscillator.type = voiceMode === 'male' ? 'triangle' : 'sine';
    oscillator.frequency.value = voiceMode === 'male' ? frequency / 2 : frequency;
    noteGain.gain.setValueAtTime(0.0001, at);
    noteGain.gain.exponentialRampToValueAtTime(0.22, at + 0.08);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, at + 1.35);
    oscillator.connect(noteGain);
    noteGain.connect(gainRef.current!);
    oscillator.start(at);
    oscillator.stop(at + 1.4);
  };

  const beginPlayback = () => {
    stopAudio();
    const context = new AudioContext();
    const masterGain = context.createGain();
    masterGain.gain.value = volume / 280;
    masterGain.connect(context.destination);
    audioContextRef.current = context;
    gainRef.current = masterGain;

    let noteIndex = 0;
    playTone(context, melody[noteIndex], context.currentTime);
    melodyTimerRef.current = window.setInterval(() => {
      noteIndex = (noteIndex + 1) % melody.length;
      playTone(context, melody[noteIndex], context.currentTime);
    }, 1420);

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.lang = 'ml-IN';
      utterance.rate = 0.72;
      utterance.pitch = voiceMode === 'male' ? 0.72 : 1.24;
      const voices = window.speechSynthesis.getVoices();
      const malayalamVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('ml'));
      const chosen = voiceMode === 'female' ? malayalamVoices.at(-1) : malayalamVoices[0];
      if (chosen) utterance.voice = chosen;
      window.speechSynthesis.speak(utterance);
    }

    elapsedTimerRef.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= passage.duration) {
          stopAudio();
          setIsPlaying(false);
          return 0;
        }
        return current + 1;
      });
    }, 1000);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      beginPlayback();
      setIsPlaying(true);
    }
  };

  const choosePassage = (index: number) => {
    stopAudio();
    setPassageIndex(index);
    setProgress(0);
    setIsPlaying(false);
    setShowLibrary(false);
    setLiked(false);
  };

  const stepPassage = (direction: number) => choosePassage((passageIndex + direction + passages.length) % passages.length);

  const sharePassage = async () => {
    const shareData = { title: `${passage.book} ${passage.chapter} — പാടുന്ന വേദപുസ്തകം`, text: passage.text[0], url: window.location.href };
    if (navigator.share) await navigator.share(shareData);
    else await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
    setShared(true);
    window.setTimeout(() => setShared(false), 1800);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="relative z-20 flex h-20 items-center justify-between border-b border-white/10 px-5 sm:px-10 lg:px-16">
        <button className="flex items-center gap-3 text-left" onClick={() => choosePassage(0)} aria-label="ഹോം">
          <WaveMark small />
          <span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.32em] text-gold/80">Sing Malayalam</span>
            <span className="font-serif-malayalam text-lg font-semibold text-cream">പാടുന്ന വേദപുസ്തകം</span>
          </span>
        </button>
        <nav className="hidden items-center gap-8 text-sm text-cream/65 md:flex" aria-label="പ്രധാന നാവിഗേഷൻ">
          <button className="transition hover:text-cream" onClick={() => setShowLibrary(true)}>വേദപുസ്തകം</button>
          <button className="transition hover:text-cream" onClick={() => choosePassage(1)}>ഇന്നത്തെ ഗാനം</button>
          <a className="transition hover:text-cream" href="#about">ഞങ്ങളെക്കുറിച്ച്</a>
        </nav>
        <Button variant="ghost" size="icon-lg" className="text-cream hover:bg-white/10 hover:text-cream md:hidden" onClick={() => setShowLibrary(true)} aria-label="മെനു തുറക്കുക"><Menu /></Button>
        <Button variant="outline" className="hidden h-10 rounded-full border-white/15 bg-white/5 px-5 text-cream hover:bg-white/10 hover:text-cream md:inline-flex" onClick={() => setShowLibrary(true)}><BookOpen /> അധ്യായങ്ങൾ</Button>
      </header>

      <section className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-[1500px] items-center gap-10 px-5 py-10 sm:px-10 lg:grid-cols-[0.82fr_1.18fr] lg:px-16 lg:py-16">
        <div className="ambient-orb ambient-orb-one" /><div className="ambient-orb ambient-orb-two" />
        <div className="relative z-10 max-w-xl lg:pb-14">
          <div className="mb-7 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-gold"><span className="h-px w-10 bg-gold/60" />വചനങ്ങൾ സംഗീതമാകുമ്പോൾ</div>
          <h1 className="font-serif-malayalam text-[clamp(2.9rem,7vw,6.6rem)] font-semibold leading-[1.08] tracking-[-0.045em] text-cream">വചനം<br /><span className="italic text-gold">ഹൃദയത്തിൽ</span><br />പാടട്ടെ.</h1>
          <p className="mt-7 max-w-md font-serif-malayalam text-lg leading-8 text-cream/62">മലയാള തിരുവെഴുത്തുകൾ പരമ്പരാഗത സ്തുതിഗീത ശൈലിയിൽ ശ്രവിക്കുക. ശാന്തമായി കേൾക്കൂ, ധ്യാനിക്കൂ, കൂടെ പാടൂ.</p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button onClick={togglePlayback} className="h-14 rounded-full bg-gold px-7 text-base font-bold text-ink shadow-[0_18px_50px_rgba(204,164,92,.2)] hover:bg-[#e2bf7b]">
              {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current" />}{isPlaying ? 'താൽക്കാലികമായി നിർത്തുക' : 'ഇന്നത്തെ ഗാനം കേൾക്കൂ'}
            </Button>
            <span className="flex items-center gap-2 text-sm text-cream/45"><Sparkles className="size-4 text-gold" /> സൗജന്യം · പരസ്യങ്ങളില്ല</span>
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[680px]">
          <div className="player-card relative overflow-hidden rounded-[2rem] border border-white/12 bg-[#f3ead7] p-5 text-ink shadow-[0_45px_100px_rgba(0,0,0,.34)] sm:p-8">
            <div className="paper-grain" aria-hidden="true" />
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-6">
                <div><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.28em] text-rust">ഇപ്പോൾ കേൾക്കുന്നത്</p><h2 className="font-serif-malayalam text-3xl font-bold sm:text-4xl">{passage.book} {passage.chapter}</h2><p className="mt-1 text-sm text-ink/48">{passage.english} · {passage.mood}</p></div><WaveMark />
              </div>
              <div className="relative min-h-[250px] py-8 sm:min-h-[290px] sm:py-10">
                <span className="absolute -left-1 top-6 font-serif text-7xl leading-none text-rust/16">“</span>
                <div className="relative space-y-5 pl-6 sm:pl-9">
                  {passage.text.map((line, index) => (
                    <p key={line} className={`font-serif-malayalam text-xl leading-[1.9] transition-colors sm:text-2xl ${index === Math.min(Math.floor((progress / passage.duration) * passage.text.length), passage.text.length - 1) && isPlaying ? 'text-rust' : 'text-ink/86'}`}>
                      <sup className="mr-2 align-super text-[10px] font-bold text-rust/60">{index + 1}</sup>{line}
                    </p>
                  ))}
                </div>
              </div>
              <div className="space-y-5 rounded-[1.4rem] border border-ink/8 bg-white/38 p-4 sm:p-5">
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-xs font-semibold text-ink/45">
                  <span>{formatTime(progress)}</span>
                  <Slider value={[progress]} max={passage.duration} onValueChange={(value) => setProgress(Number(Array.isArray(value) ? value[0] : value))} aria-label="ഗാനത്തിന്റെ പുരോഗതി" className="[&_[data-slot=slider-range]]:bg-rust [&_[data-slot=slider-thumb]]:border-rust [&_[data-slot=slider-track]]:bg-ink/12" />
                  <span>{formatTime(passage.duration)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button variant="ghost" size="icon-lg" className="rounded-full text-ink/55 hover:bg-ink/8" onClick={() => stepPassage(-1)} aria-label="മുൻ അധ്യായം"><ChevronLeft /></Button>
                  <Button variant="ghost" size="icon-lg" className="rounded-full text-ink/55 hover:bg-ink/8" onClick={() => { setProgress(0); if (isPlaying) beginPlayback(); }} aria-label="വീണ്ടും തുടങ്ങുക"><RotateCcw /></Button>
                  <Button onClick={togglePlayback} size="icon-lg" className="size-16 rounded-full bg-rust text-white shadow-lg hover:bg-[#873c2b]" aria-label={isPlaying ? 'നിർത്തുക' : 'കേൾക്കുക'}>{isPlaying ? <Pause className="size-6 fill-current" /> : <Play className="size-6 fill-current" />}</Button>
                  <Button variant="ghost" size="icon-lg" className="rounded-full text-ink/55 hover:bg-ink/8" onClick={() => stepPassage(1)} aria-label="അടുത്ത അധ്യായം"><ChevronRight /></Button>
                  <Button variant="ghost" size="icon-lg" className="rounded-full text-ink/55 hover:bg-ink/8" onClick={() => setLiked(!liked)} aria-label="പ്രിയപ്പെട്ടതാക്കുക"><Heart className={liked ? 'fill-rust text-rust' : ''} /></Button>
                </div>
                <div className="flex flex-col gap-4 border-t border-ink/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <fieldset className="flex items-center gap-1 rounded-full bg-ink/6 p-1" aria-label="ശബ്ദം തിരഞ്ഞെടുക്കുക">
                    {(['male', 'female'] as const).map((mode) => (
                      <button key={mode} onClick={() => { setVoiceMode(mode); if (isPlaying) beginPlayback(); }} className={`rounded-full px-4 py-2 text-xs font-bold transition ${voiceMode === mode ? 'bg-ink text-cream shadow-sm' : 'text-ink/50 hover:text-ink'}`} aria-pressed={voiceMode === mode}>
                        {mode === 'male' ? 'പുരുഷ ശബ്ദം' : 'സ്ത്രീ ശബ്ദം'}
                      </button>
                    ))}
                  </fieldset>
                  <div className="flex items-center gap-3"><Volume2 className="size-4 text-ink/38" /><Slider value={[volume]} onValueChange={(value) => setVolume(Number(Array.isArray(value) ? value[0] : value))} className="w-24 [&_[data-slot=slider-range]]:bg-ink/50" aria-label="ശബ്ദത്തിന്റെ അളവ്" /><Button variant="ghost" size="icon-sm" className="text-ink/40" onClick={sharePassage} aria-label="പങ്കിടുക"><Share2 /></Button></div>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-5 text-center text-xs leading-5 text-cream/38">മലയാളം സത്യവേദപുസ്തകം 1910 · പൊതുസഞ്ചയം<br />{shared ? 'ലിങ്ക് പകർത്തി ✓' : 'ഉപകരണത്തിലെ ശബ്ദലഭ്യത അനുസരിച്ച് ആലാപനം മാറാം'}</p>
        </div>
      </section>

      <section id="about" className="border-t border-white/8 bg-[#121b20] px-5 py-20 text-center sm:px-10">
        <Music2 className="mx-auto mb-5 size-7 text-gold" /><p className="mx-auto max-w-2xl font-serif-malayalam text-2xl leading-relaxed text-cream/82 sm:text-3xl">“ക്രിസ്തുവിന്റെ വചനം സകലജ്ഞാനത്തോടുംകൂടെ നിങ്ങളിൽ സമൃദ്ധിയായി വസിക്കട്ടെ.”</p><p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-gold/65">കൊലൊസ്സ്യർ 3:16</p>
      </section>

      {showLibrary && (
        <dialog open className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none justify-end bg-black/55 p-0 backdrop-blur-sm" aria-label="അധ്യായങ്ങൾ">
          <button className="absolute inset-0 cursor-default" onClick={() => setShowLibrary(false)} aria-label="അടയ്ക്കുക" />
          <aside className="relative h-full w-full max-w-md overflow-y-auto bg-[#f3ead7] p-6 text-ink shadow-2xl sm:p-9">
            <div className="mb-10 flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-rust">ഗാനശേഖരം</p><h2 className="mt-2 font-serif-malayalam text-3xl font-bold">ഒരു വചനം തിരഞ്ഞെടുക്കൂ</h2></div><Button variant="ghost" size="icon-lg" className="rounded-full" onClick={() => setShowLibrary(false)} aria-label="അടയ്ക്കുക"><X /></Button></div>
            <div className="space-y-3">
              {passages.map((item, index) => (
                <button key={item.id} onClick={() => choosePassage(index)} className={`group flex w-full items-center justify-between rounded-2xl border p-5 text-left transition ${index === passageIndex ? 'border-rust/40 bg-rust text-white shadow-lg' : 'border-ink/10 bg-white/45 hover:-translate-y-0.5 hover:border-rust/35 hover:bg-white/75'}`}>
                  <span><span className={`block text-[10px] font-bold uppercase tracking-[0.2em] ${index === passageIndex ? 'text-white/60' : 'text-rust'}`}>{item.mood}</span><span className="mt-1 block font-serif-malayalam text-xl font-bold">{item.book} {item.chapter}</span></span><Play className={`size-5 ${index === passageIndex ? 'fill-white' : 'text-rust transition group-hover:translate-x-1'}`} />
                </button>
              ))}
            </div>
            <div className="mt-10 rounded-2xl border border-ink/10 bg-white/35 p-5 text-sm leading-6 text-ink/55">ആദ്യ പതിപ്പിൽ ധ്യാനത്തിനായി നാല് തിരഞ്ഞെടുത്ത ഭാഗങ്ങൾ. കൂടുതൽ പുസ്തകങ്ങളും അധ്യായങ്ങളും തുടർന്നുള്ള പതിപ്പുകളിൽ ചേർക്കാം.</div>
          </aside>
        </dialog>
      )}
    </main>
  );
}
