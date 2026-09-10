import { useState } from 'react'
import './App.css'

function formatStudentName(value) {
  const name = value.trim().split(/\s+/)[0].replace(/[^a-zA-Z'-]/g, '')
  return name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : 'Student'
}

function App() {
  const [showLogin, setShowLogin] = useState(false)
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [accountName, setAccountName] = useState('Student')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [authCredentials, setAuthCredentials] = useState(null)
  const [isCreatingStudent, setIsCreatingStudent] = useState(false)
  const [createStudentError, setCreateStudentError] = useState('')
  const [createdStudent, setCreatedStudent] = useState(null)
  const [students, setStudents] = useState([])

  const schoolName = 'ABC Nursery and Primary School, Madurai'

  if (!showLogin) {
    return (
      <main className="welcome-page">
        <header className="welcome-nav">
          <a className="welcome-brand" href="#top" aria-label="ABC School home">
            <span className="welcome-mark">ABC</span>
            <span><strong>ABC Nursery and Primary School</strong><small>Madurai</small></span>
          </a>
          <nav aria-label="Main navigation">
            <a href="#about">About us</a>
            <a href="#events">Events</a>
            <a href="#contact">Contact</a>
          </nav>
          <button className="nav-login" type="button" onClick={() => setShowLogin(true)}>Login <span aria-hidden="true">&#8594;</span></button>
        </header>

        <section className="welcome-hero" id="top">
          <div className="hero-copy">
            <p className="welcome-kicker">Learning. Growing. Belonging.</p>
            <h1>A bright beginning<br /><em>for every child.</em></h1>
            <p>Welcome to ABC Nursery and Primary School, Madurai, where curious minds become confident learners in a caring school community.</p>
            <div className="hero-actions"><button className="hero-login" type="button" onClick={() => setShowLogin(true)}>Student &amp; Teacher Login <span aria-hidden="true">&#8594;</span></button><a href="#about" className="discover-link">Discover our school <span aria-hidden="true">&#8595;</span></a></div>
          </div>
          <div className="hero-image-wrap"><img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1100&q=85" alt="Children learning together in a bright classroom" /><span className="hero-sticker">A place<br /><strong>to bloom</strong></span></div>
        </section>

        <section className="about-strip" id="about"><div><span className="stat-number">01</span><strong>Happy learners</strong><p>Every child is known, valued, and encouraged.</p></div><div><span className="stat-number">02</span><strong>Strong foundations</strong><p>Playful discovery meets purposeful learning.</p></div><div><span className="stat-number">03</span><strong>One community</strong><p>Families and teachers grow together.</p></div></section>

        <section className="events-section" id="events">
          <div className="section-heading"><div><p className="welcome-kicker">School life</p><h2>There is always<br /><em>something happening.</em></h2></div><a href="#contact">View school calendar <span aria-hidden="true">&#8594;</span></a></div>
          <div className="event-grid"><article className="event-card featured-event"><img src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=85" alt="Teacher helping a young student" /><div><span>18 June 2025</span><h3>Family learning morning</h3><p>Come into the classroom and discover what your child has been learning.</p></div></article><article className="event-card"><img src="https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=700&q=85" alt="Children enjoying an outdoor school activity" /><div><span>27 June 2025</span><h3>Little explorers day</h3><p>A day of nature, play, and big questions.</p></div></article><article className="event-card"><img src="https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=700&q=85" alt="Students working together at a table" /><div><span>04 July 2025</span><h3>Community reading week</h3><p>Stories, guest readers, and a school full of imagination.</p></div></article></div>
        </section>

        <footer className="welcome-footer" id="contact"><div><span className="welcome-mark">ABC</span><strong>ABC Nursery and Primary School, Madurai</strong></div><p>Growing bright futures together.</p><button type="button" onClick={() => setShowLogin(true)}>Open school login <span aria-hidden="true">&#8594;</span></button></footer>
      </main>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setIsSigningIn(true)
    setLoginError('')

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          username: formData.get('account-id'),
          password: formData.get('password'),
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Unable to sign in.')
      }

      setAccountName(result.user.name || formatStudentName(formData.get('account-id')))
      setAuthCredentials({ username: formData.get('account-id'), password: formData.get('password') })
      setSignedIn(true)
      if (role === 'teacher') {
        await loadStudents(formData.get('account-id'), formData.get('password'))
      }
    } catch (error) {
      setLoginError(error.message || 'Unable to connect to the school server.')
    } finally {
      setIsSigningIn(false)
    }
  }

  async function loadStudents(username, password) {
    const credentials = btoa(`${username}:${password}`)
    const response = await fetch('/api/students', { headers: { Authorization: `Basic ${credentials}` } })
    const result = await response.json()
    if (response.ok) setStudents(result.students)
  }

  async function handleCreateStudent(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setIsCreatingStudent(true)
    setCreateStudentError('')
    setCreatedStudent(null)

    try {
      const credentials = btoa(`${authCredentials.username}:${authCredentials.password}`)
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Basic ${credentials}` },
        body: JSON.stringify({ name: formData.get('student-name'), username: formData.get('student-username'), password: formData.get('student-password') }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to create student account.')
      setCreatedStudent(result.student)
      event.currentTarget.reset()
      await loadStudents(authCredentials.username, authCredentials.password)
    } catch (error) {
      setCreateStudentError(error.message || 'Unable to connect to the school server.')
    } finally {
      setIsCreatingStudent(false)
    }
  }

  return (
    <main className="login-shell">
      <div className="ambient-shape shape-one" />
      <div className="ambient-shape shape-two" />

      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">ABC</div>
          <div><strong>ABC Nursery and Primary School</strong><span>Madurai &middot; {role === 'student' ? 'Student portal' : 'Teacher portal'}</span></div>
        </div>
        <div className="login-top-actions"><button type="button" className="back-home" onClick={() => setShowLogin(false)}>&#8592; School home</button><span className="secure-label"><span className="lock-icon">&#9679;</span> Secure sign in</span></div>
      </header>

      <section className="login-layout">
        <div className="welcome-copy">
          <p className="eyebrow">Welcome back</p>
          <h1>Your school day<br /><em>starts here.</em></h1>
          <p className="intro">Log in to see your {role === 'student' ? 'lessons, activities, announcements, and everything waiting for you today' : 'classes, attendance, announcements, and everything you need for today'}.</p>
          <div className="school-note"><div className="note-icon" aria-hidden="true">+</div><div><strong>One school. One community.</strong><span>Madurai &middot; Nursery and Primary</span></div></div>
        </div>

        <div className="login-card">
          <div className="card-heading"><p className="eyebrow">{role === 'student' ? 'Student access' : 'Teacher access'}</p><h2>Sign in to your account</h2><p>Choose your role to continue.</p></div>

          <div className="role-switcher" role="tablist" aria-label="Choose account type">
            {['student', 'teacher'].map((accountRole) => (
              <button key={accountRole} type="button" role="tab" aria-selected={role === accountRole} className={role === accountRole ? 'active' : ''} onClick={() => { setRole(accountRole); setSignedIn(false); setCreatedStudent(null); setCreateStudentError(''); setStudents([]) }}>
                <span className="role-icon" aria-hidden="true">{accountRole === 'student' ? 'S' : 'T'}</span>
                <span>{accountRole === 'student' ? 'Student' : 'Teacher'}<small>{accountRole === 'student' ? 'Learner account' : 'Staff account'}</small></span>
              </button>
            ))}
          </div>

          {signedIn ? (
            <div className="success-message home-message" role="status"><div className="success-icon">&#10003;</div><p className="eyebrow">{role === 'student' ? 'Student home' : 'Teacher home'}</p><h3>Welcome, {accountName}</h3><p>Your {schoolName} {role === 'student' ? 'student' : 'teacher'} dashboard is ready.</p>{role === 'teacher' && <div className="faculty-tools"><div className="faculty-heading"><strong>Faculty tools</strong><span>Create as many student logins as needed</span></div><form onSubmit={handleCreateStudent}><label htmlFor="student-name">Student name</label><input id="student-name" name="student-name" type="text" placeholder="e.g. Kavya" required /><div className="faculty-fields"><div><label htmlFor="student-username">Username</label><input id="student-username" name="student-username" type="text" placeholder="e.g. kavya" required /></div><div><label htmlFor="student-password">Temporary password</label><input id="student-password" name="student-password" type="text" placeholder="Create password" required /></div></div>{createStudentError && <p className="login-error" role="alert">{createStudentError}</p>}{createdStudent && <p className="create-success" role="status">Login created for {createdStudent.name}: <strong>{createdStudent.username}</strong></p>}<button className="submit-button" type="submit" disabled={isCreatingStudent}>{isCreatingStudent ? 'Creating login...' : 'Create another student login'} <span aria-hidden="true">&#8594;</span></button></form><div className="student-list"><strong>Student accounts ({students.length})</strong>{students.map((student) => <div className="student-row" key={student._id}><span>{student.name}</span><small>{student.username}</small></div>)}</div></div>}<button type="button" className="text-button" onClick={() => { setSignedIn(false); setAuthCredentials(null); setStudents([]) }}>Sign out</button></div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label htmlFor="account-id">{role === 'student' ? 'Student name or ID' : 'Teacher name or ID'}</label>
              <input id="account-id" name="account-id" type="text" placeholder={role === 'student' ? 'e.g. Arjun' : 'e.g. Priya'} autoComplete="username" required />
              <div className="password-label"><label htmlFor="password">Password</label><a href="#help">Need help?</a></div>
              <div className="password-field"><input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" required /><button type="button" className="show-password" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div>
              <label className="remember"><input type="checkbox" /> <span>Keep me signed in on this device</span></label>
              {loginError && <p className="login-error" role="alert">{loginError}</p>}
              <button className="submit-button" type="submit" disabled={isSigningIn}>{isSigningIn ? 'Checking account...' : 'Sign in'} <span aria-hidden="true">&#8594;</span></button>
              <p className="login-hint">Demo {role} login: <strong>{role === 'teacher' ? 'priya' : 'arjun'}</strong> / <strong>{role === 'teacher' ? 'teacher123' : 'student123'}</strong></p>
            </form>
          )}

          <p className="privacy-note">Your account is protected by ABC School IT.<br />Never share your password with anyone.</p>
        </div>
      </section>

      <footer><span>2025 ABC Nursery and Primary School</span><a href="#help" id="help">Contact school office</a><span>Privacy</span></footer>
    </main>
  )
}

export default App
