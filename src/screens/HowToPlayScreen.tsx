import { useGame } from '../store/GameContext';
import { GothicScreen, GothicButton } from '../components/GothicLayout';

const gold = '#c8a84a';
const goldDim = 'rgba(200,168,74,0.55)';
const cream = '#e8d5a8';
const muted = 'rgba(220,200,160,0.45)';
const green = '#4caf7a';
const red = '#c0392b';
const purple = '#8b5cf6';
const blue = '#5b9fd4';
const orange = '#e08c3a';

const panel: React.CSSProperties = {
  background: 'rgba(18,11,24,0.95)',
  border: '1px solid rgba(140,100,45,0.35)',
  borderRadius: 10,
  padding: '18px 20px',
  marginBottom: 14,
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
};

const secLabel: React.CSSProperties = {
  fontFamily: "'Cinzel', serif",
  fontSize: '0.68rem',
  letterSpacing: '0.2em',
  color: goldDim,
  textTransform: 'uppercase' as const,
  marginBottom: 10,
};

const h2: React.CSSProperties = {
  fontFamily: "'Cinzel', serif",
  fontSize: '1.1rem',
  fontWeight: 700,
  color: cream,
  margin: '0 0 14px',
};

export default function HowToPlayScreen() {
  const { dispatch } = useGame();

  return (
    <GothicScreen>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(6,3,12,0.95)',
        borderBottom: '1px solid rgba(120,80,40,0.4)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
      }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.68rem', letterSpacing: '0.15em', color: goldDim }}>คู่มือเกม</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, color: gold, fontSize: '1rem' }}>Party Clue</div>
        </div>
        <button
          onClick={() => dispatch({ type: 'GO_BACK_HOWTOPLAY' })}
          style={{ background: 'transparent', border: '1px solid rgba(120,80,40,0.4)', borderRadius: 6, color: 'rgba(200,180,140,0.7)', cursor: 'pointer', padding: '6px 14px', fontFamily: "'Cinzel', serif", fontSize: '0.75rem' }}
        >
          ← กลับ
        </button>
      </div>

      <div style={{ padding: '20px 16px 60px', maxWidth: 680, margin: '0 auto' }}>

        {/* Goal */}
        <div style={{ ...panel, background: 'linear-gradient(135deg, rgba(192,57,43,0.18), rgba(140,80,20,0.12))', border: '1px solid rgba(192,57,43,0.4)', textAlign: 'center' }}>
          <div style={{ ...secLabel, color: 'rgba(192,57,43,0.8)', marginBottom: 6 }}>เป้าหมาย</div>
          <div style={{ fontSize: '1rem', color: cream, fontStyle: 'italic' }}>
            ใช้เบาะแสที่มีในมือ <strong style={{ color: gold, fontStyle: 'normal' }}>ทายคำตอบให้ถูกต้องก่อนผู้เล่นคนอื่น</strong> เพื่อชนะเกม
          </div>
        </div>

        {/* Starting hand */}
        <div style={panel}>
          <div style={secLabel}>เริ่มเกม</div>
          <div style={h2}>มือเริ่มต้น</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[
              { icon: '📄', name: 'Normal Clue', desc: '1 ใบ — อ่านได้ทันที' },
              { icon: '🔒', name: 'Locked Clue', desc: '1 ใบ — ต้อง Decode ก่อน' },
              { icon: '🃏', name: 'Action Card', desc: '1 ใบ — ใช้ในเทิร์นของตัวเอง' },
            ].map(item => (
              <div key={item.name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(140,100,45,0.3)', borderRadius: 8, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 5 }}>{item.icon}</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.68rem', color: gold, letterSpacing: '0.06em', marginBottom: 3 }}>{item.name}</div>
                <div style={{ fontSize: '0.78rem', color: muted }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.82rem', color: muted, padding: '10px 0 0', borderTop: '1px solid rgba(140,100,45,0.25)' }}>
            🌐 Public Clue 1 ใบจะเปิดให้ทุกคนเห็นตั้งแต่เริ่มเกม
          </div>
        </div>

        {/* Turn flow */}
        <div style={panel}>
          <div style={secLabel}>เทิร์น</div>
          <div style={h2}>โครงสร้างแต่ละเทิร์น</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Redraw */}
            <div style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'rgba(76,175,122,0.06)', border: '1px solid rgba(76,175,122,0.35)', borderRadius: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(76,175,122,0.15)', border: `1px solid rgba(76,175,122,0.5)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: green, fontSize: '0.9rem', flexShrink: 0 }}>↺</div>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.82rem', color: cream, marginBottom: 2 }}>Redraw (ฟรี — ทำได้ 1 ครั้งต่อเทิร์น)</div>
                <div style={{ fontSize: '0.82rem', color: muted }}>ทิ้ง Action card 1 ใบ จั่วใหม่ 1 ใบ ก่อนเลือก action หลัก</div>
              </div>
            </div>
            {/* Choose 1 */}
            <div style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'rgba(200,168,74,0.05)', border: '1px solid rgba(200,168,74,0.35)', borderRadius: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(200,168,74,0.15)', border: `1px solid ${goldDim}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: gold, fontFamily: "'Cinzel', serif", fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>1</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.82rem', color: cream, marginBottom: 8 }}>เลือก 1 อย่างจาก</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[{ icon: '🃏', name: 'จั่วการ์ด' }, { icon: '⚡', name: 'เล่น Action' }, { icon: '🎯', name: 'ทายคำตอบ' }].map(o => (
                    <div key={o.name} style={{ background: 'rgba(200,168,74,0.07)', border: '1px solid rgba(200,168,74,0.2)', borderRadius: 7, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', marginBottom: 3 }}>{o.icon}</div>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.68rem', color: gold }}>{o.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Rules */}
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(140,100,45,0.25)' }}>
            {[
              { text: '❌ Pass ไม่ได้', ok: false },
              { text: '✓ Redraw ไม่นับเป็น action', ok: true },
              { text: '❌ Redraw ทำได้แค่ 1 ครั้งต่อเทิร์น', ok: false },
            ].map(r => (
              <span key={r.text} style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontFamily: "'Cinzel', serif", letterSpacing: '0.03em', border: `1px solid ${r.ok ? 'rgba(76,175,122,0.4)' : 'rgba(192,57,43,0.4)'}`, background: r.ok ? 'rgba(76,175,122,0.08)' : 'rgba(192,57,43,0.08)', color: r.ok ? green : red }}>
                {r.text}
              </span>
            ))}
          </div>
        </div>

        {/* Draw deck */}
        <div style={panel}>
          <div style={secLabel}>กองจั่ว</div>
          <div style={h2}>สัดส่วนการ์ดในกอง</div>
          <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(140,100,45,0.3)', marginBottom: 10 }}>
            <div style={{ width: '80%', background: 'linear-gradient(90deg,rgba(200,168,74,0.5),rgba(200,168,74,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cinzel', serif", fontSize: '0.72rem', color: gold }}>Action 80%</div>
            <div style={{ width: '20%', background: 'linear-gradient(90deg,rgba(91,159,212,0.3),rgba(91,159,212,0.5))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cinzel', serif", fontSize: '0.72rem', color: blue }}>Clue 20%</div>
          </div>
          <div style={{ fontSize: '0.82rem', color: muted, fontStyle: 'italic' }}>จั่วได้ Clue → เข้ามือทันที และถือว่าใช้ action ของเทิร์นนั้นไปแล้ว</div>
        </div>

        {/* Clue types */}
        <div style={panel}>
          <div style={secLabel}>เบาะแส</div>
          <div style={h2}>ประเภท Clue</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: '📄 Normal', desc: 'อ่านได้ทันที มองเห็นข้อมูลเต็มๆ', borderColor: 'rgba(200,168,74,0.4)', bg: 'rgba(200,168,74,0.07)', color: gold },
              { label: '🔒 Locked', desc: 'ถูกซ่อนไว้ ต้องใช้การ์ด Decode เพื่อปลดล็อก', borderColor: 'rgba(139,92,246,0.4)', bg: 'rgba(139,92,246,0.07)', color: purple },
              { label: '🌐 Public', desc: 'เปิดเผยกลางโต๊ะ ทุกคนเห็นได้ตลอดเวลา', borderColor: 'rgba(91,159,212,0.4)', bg: 'rgba(91,159,212,0.07)', color: blue },
            ].map(c => (
              <div key={c.label} style={{ borderRadius: 8, padding: '12px 12px', border: `1px solid ${c.borderColor}`, background: c.bg }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.72rem', color: c.color, fontWeight: 700, marginBottom: 5 }}>{c.label}</div>
                <div style={{ fontSize: '0.78rem', color: muted, lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Action cards */}
        <div style={panel}>
          <div style={secLabel}>การ์ด Action</div>
          <div style={h2}>การ์ดทั้งหมด</div>
          {[
            {
              cat: '🔍 ข้อมูล', cards: [
                { name: 'SPY', qty: 7, desc: 'แอบดู Normal Clue 1 ใบจากมือของผู้เล่นที่เลือก' },
                { name: 'INVESTIGATE', qty: 8, desc: 'จั่ว Clue 2 ใบจากกอง เลือกเก็บ 1 ใบ คืนอีก 1 ใบ' },
              ]
            },
            {
              cat: '🃏 เบาะแส', cards: [
                { name: 'DECODE', qty: 7, desc: 'เปลี่ยน Locked Clue 1 ใบในมือตัวเองให้กลายเป็น Normal' },
                { name: 'ENCODE', qty: 5, desc: 'เปลี่ยน Normal Clue 1 ใบในมือตัวเองให้กลายเป็น Locked' },
                { name: 'SWAP', qty: 5, desc: 'แลก Clue 1 ใบของตัวเองกับ Clue 1 ใบของผู้เล่นที่เลือก' },
              ]
            },
            {
              cat: '⚔️ โจมตี', cards: [
                { name: 'STEAL', qty: 4, desc: 'ขโมย Clue 1 ใบจากมือของผู้เล่นที่เลือก (เลือกแบบสุ่มตาบอด)' },
                { name: 'DISCARD', qty: 6, desc: 'บังคับผู้เล่นที่เลือกทิ้ง Clue 1 ใบ หรือ Action 3 ใบ' },
                { name: 'BLACKOUT', qty: 6, desc: 'ผู้เล่นที่เลือกข้ามเทิร์นหน้า (จั่วอัตโนมัติแล้วจบ)' },
              ]
            },
            {
              cat: '🛡 พิเศษ', cards: [
                { name: 'SHUTDOWN', qty: 6, desc: 'ยกเลิก Action ที่กำลังจะเกิดขึ้น — ใช้ภายใน 5 วินาที' },
                { name: 'ANONYMOUS_GUESS', qty: 6, desc: 'ทายคำตอบโดยไม่โดนโทษหากตอบผิด' },
              ]
            },
          ].map(group => (
            <div key={group.cat} style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.72rem', letterSpacing: '0.12em', color: goldDim, textTransform: 'uppercase' as const, marginBottom: 8 }}>{group.cat}</div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                {group.cards.map(c => (
                  <div key={c.name} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 12px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(140,100,45,0.25)', borderRadius: 7 }}>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem', color: cream, fontWeight: 600, minWidth: 110, flexShrink: 0 }}>{c.name}</span>
                    <span style={{ fontSize: '0.68rem', color: goldDim, background: 'rgba(200,168,74,0.1)', border: '1px solid rgba(200,168,74,0.2)', borderRadius: 4, padding: '1px 6px', flexShrink: 0, alignSelf: 'center' }}>×{c.qty}</span>
                    <span style={{ fontSize: '0.84rem', color: muted, minWidth: 0 }}>{c.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Shutdown rule */}
        <div style={{ ...panel, background: 'rgba(224,140,58,0.1)', border: '1px solid rgba(224,140,58,0.4)' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>⚡</span>
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.9rem', color: orange, marginBottom: 6 }}>กฎพิเศษ: SHUTDOWN</div>
              <div style={{ fontSize: '0.88rem', color: muted, lineHeight: 1.55 }}>เมื่อใครก็ตามเล่น Action ระบบจะรอ <strong style={{ color: orange }}>5 วินาที</strong> ก่อนดำเนินการ ผู้เล่นคนใดก็ได้ที่มีการ์ด SHUTDOWN ในมือสามารถกดเพื่อยกเลิก Action นั้นได้ทันที — ไม่นับเป็น action ของเทิร์นตัวเอง</div>
            </div>
          </div>
        </div>

        {/* Guess rules */}
        <div style={panel}>
          <div style={secLabel}>การทาย</div>
          <div style={h2}>เงื่อนไขการทายคำตอบ</div>
          <div style={{ fontSize: '0.85rem', color: muted, marginBottom: 12 }}>การทายถือเป็น action ของเทิร์น — ทายแล้วไม่สามารถจั่วหรือเล่น Action เพิ่มได้</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div style={{ borderRadius: 8, padding: '12px 14px', border: '1px solid rgba(76,175,122,0.4)', background: 'rgba(76,175,122,0.08)' }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.78rem', color: green, marginBottom: 5 }}>✓ ตอบถูก</div>
              <div style={{ fontSize: '0.84rem', color: muted }}>ชนะเกมทันที ผู้เล่นคนนั้นได้รับการประกาศเป็นผู้ชนะ</div>
            </div>
            <div style={{ borderRadius: 8, padding: '12px 14px', border: '1px solid rgba(192,57,43,0.4)', background: 'rgba(192,57,43,0.08)' }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.78rem', color: red, marginBottom: 5 }}>✗ ตอบผิด</div>
              <div style={{ fontSize: '0.84rem', color: muted }}>โดนโทษ — ต้องทิ้ง Clue 1 ใบจากมือ เทิร์นจบทันที</div>
            </div>
          </div>
          <div style={{ fontSize: '0.82rem', color: muted, padding: '10px 0 0', borderTop: '1px solid rgba(140,100,45,0.25)' }}>
            💡 ใช้การ์ด <strong style={{ color: cream }}>ANONYMOUS_GUESS</strong> เพื่อทายโดยไม่โดนโทษหากตอบผิด
          </div>
        </div>

        <GothicButton variant="primary" fullWidth onClick={() => dispatch({ type: 'GO_BACK_HOWTOPLAY' })}>
          ← กลับ
        </GothicButton>

      </div>
    </GothicScreen>
  );
}
