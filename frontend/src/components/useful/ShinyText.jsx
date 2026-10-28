import './ShinyText.css';

// Pure-CSS shine (a moving background gradient clipped to the text).
// It used to be driven frame by frame from JS with the `motion`
// library, which put ~100 KB (gzipped) in the bundle every visitor
// downloads before the login form, for one line of text.
const ShinyText = ({
  text,
  a,
  mail,
  disabled = false,
  speed = 2,
  className = '',
  color = '#b5b5b5',
  shineColor = '#ffffff',
  spread = 120,
  yoyo = false,
  pauseOnHover = false,
  direction = 'left',
}) => {
  const style = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
    animationDuration: `${speed}s`,
    animationDirection: yoyo
      ? (direction === 'left' ? 'alternate' : 'alternate-reverse')
      : (direction === 'left' ? 'normal' : 'reverse'),
  };
  const classes = [
    'shiny-text',
    disabled && 'shiny-text--disabled',
    pauseOnHover && 'shiny-text--pause-on-hover',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} style={style}>
      {text}
      <a href={`mailto:${mail}`}>{a}</a>
    </span>
  );
};

export default ShinyText;
