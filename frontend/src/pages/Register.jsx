import { useMemo, useState, useTransition } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthRedirectPath } from '../lib/authRedirects';
import { motion } from 'framer-motion';
import { Eye, EyeSlash, Fingerprint } from '@phosphor-icons/react';
import SocialAuthButtons from '../components/SocialAuthButtons';
import AuthVideoFrame from '../components/AuthVideoFrame';

const baseInputClass =
  'h-12 w-full border px-4 text-sm tracking-[0.02em] outline-none transition-all duration-200 rounded-none';

const emptyInputClass =
  'border-chroma-border-default bg-[#121214] text-chroma-text-primary placeholder:text-chroma-text-muted focus:border-chroma-gold focus:shadow-[0_0_0_1px_rgba(205,164,52,0.3)]';

const filledInputClass =
  'border-transparent bg-[#e8f0fe] text-[#111827] placeholder:text-[#6b7280] focus:border-chroma-gold';

const monoFooterClass = 'font-mono text-[11px] uppercase tracking-[0.32em] text-chroma-text-muted';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [protocolHandle, setProtocolHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const { register, socialLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = getAuthRedirectPath(location);
  const loginPath =
    redirectPath === '/experiencemode/sovereign' ? '/login' : `/login?redirect=${encodeURIComponent(redirectPath)}`;

  const protocolIdentity = useMemo(() => {
    const trimmedHandle = protocolHandle.trim();
    if (trimmedHandle) return trimmedHandle;
    return `${firstName} ${lastName}`.trim();
  }, [firstName, lastName, protocolHandle]);

  const isFormValid =
    firstName.trim() &&
    lastName.trim() &&
    dateOfBirth &&
    protocolIdentity &&
    email.trim() &&
    password &&
    confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isFormValid) {
      setError('Complete every required field to initialize access.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Access codes do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Access code must be at least 6 characters.');
      return;
    }

    startTransition(async () => {
      try {
        await register(protocolIdentity, email.trim(), password);
        navigate(redirectPath, { replace: true });
      } catch (err) {
        setError(err.message || 'Registration failed. Please try again.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-chroma-text-primary">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_520px] xl:grid-cols-[minmax(0,1fr)_540px]">
        <AuthVideoFrame />

        <div className="flex flex-col bg-[#030303]">
          <div className="flex flex-1 justify-center px-6 py-12 sm:px-10 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="relative z-10 flex w-full max-w-[372px] flex-col gap-7"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center border border-chroma-gold">
                  <Fingerprint size={24} className="text-chroma-gold" weight="thin" />
                </div>
                <div className="space-y-2">
                  <h1 className="font-heading text-[1.95rem] font-bold uppercase tracking-[0.04em] text-white sm:text-[2.15rem]">
                    Initialize Access
                  </h1>
                  <p className="font-mono text-[13px] tracking-[0.08em] text-chroma-text-secondary">
                    Seeker Registration
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="border border-chroma-fire/40 bg-chroma-fire/10 px-4 py-3 text-sm text-chroma-fire">
                    {error}
                  </div>
                )}

                <Field
                  label="First Name"
                  id="register-first-name-input"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={setFirstName}
                  required
                />

                <Field
                  label="Last Name"
                  id="register-last-name-input"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={setLastName}
                  required
                />

                <Field
                  label="Email Address"
                  id="register-email-input"
                  type="email"
                  placeholder="seeker@chromakeyprotocol.com"
                  value={email}
                  onChange={setEmail}
                  filled={Boolean(email)}
                  required
                />

                <Field
                  label="Date Of Birth"
                  id="register-dob-input"
                  type="date"
                  placeholder="MM / DD / YYYY"
                  value={dateOfBirth}
                  onChange={setDateOfBirth}
                  required
                />

                <PasswordField
                  label="Password"
                  id="register-password-input"
                  placeholder="Create your password"
                  value={password}
                  onChange={setPassword}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword((current) => !current)}
                  filled={Boolean(password)}
                  required
                />

                <Field
                  label="Confirm Password"
                  id="register-confirm-password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  required
                />

                <Field
                  label="Protocol Handle"
                  id="register-handle-input"
                  placeholder="Your seeker identity (optional)"
                  value={protocolHandle}
                  onChange={setProtocolHandle}
                  helper="Defaults to your name if left blank."
                />

                <Field
                  label="Access Key"
                  id="register-access-key-input"
                  placeholder="Invite / access key (optional)"
                  value={accessKey}
                  onChange={setAccessKey}
                />

                <button
                  type="submit"
                  data-testid="register-submit-btn"
                  disabled={isPending}
                  className="mt-2 flex h-12 w-full items-center justify-center bg-[#7ab829] text-sm font-bold uppercase tracking-[0.12em] text-black transition-all duration-200 hover:bg-[#8dd338] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? 'Initializing...' : 'Begin Protocol'}
                </button>
              </form>

              <SocialAuthButtons
                onSocialLogin={async (provider) => {
                  setError('');
                  try {
                    await socialLogin(provider, redirectPath);
                  } catch (err) {
                    setError(err.message || 'Social login failed. Please try again.');
                  }
                }}
                disabled={isPending}
              />

              <p className="pt-1 text-center text-sm text-chroma-text-secondary">
                Already a Seeker?{' '}
                <Link
                  to={loginPath}
                  className="text-chroma-gold transition-colors duration-200 hover:text-[#f0cc40]"
                  data-testid="login-link"
                >
                  Access Protocol
                </Link>
              </p>
            </motion.div>
          </div>

          <div className={`px-6 pb-8 pt-4 text-center sm:px-10 lg:px-12 ${monoFooterClass}`}>
            The Chroma Key Protocol // Musiq Matrix
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  helper,
  filled = false,
  required = false
}) => (
  <label className="flex flex-col gap-2">
    <span className="font-mono text-[13px] font-medium tracking-[0.02em] text-[#f4f4f5]">
      {label}
      {required ? ' *' : ''}
    </span>
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      data-testid={id}
      className={`${baseInputClass} ${filled ? filledInputClass : emptyInputClass}`}
    />
    {helper ? (
      <span className="text-xs tracking-[0.02em] text-chroma-text-muted">{helper}</span>
    ) : null}
  </label>
);

const PasswordField = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  showPassword,
  onTogglePassword,
  filled,
  required
}) => (
  <label className="flex flex-col gap-2">
    <span className="font-mono text-[13px] font-medium tracking-[0.02em] text-[#f4f4f5]">
      {label}
      {required ? ' *' : ''}
    </span>
    <div className="relative">
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        data-testid={id}
        className={`${baseInputClass} pr-12 ${filled ? filledInputClass : emptyInputClass}`}
      />
      <button
        type="button"
        onClick={onTogglePassword}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#52525b] transition-colors duration-200 hover:text-chroma-gold"
      >
        {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </label>
);

export default Register;
