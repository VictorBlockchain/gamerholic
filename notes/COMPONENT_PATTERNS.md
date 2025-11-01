# 🧩 Component Patterns & Best Practices

## 📋 Table of Contents
1. [Card Components](#card-components)
2. [Navigation Components](#navigation-components)
3. [Form Components](#form-components)
4. [Status & Badge Components](#status--badge-components)
5. [Interactive Elements](#interactive-elements)
6. [Layout Components](#layout-components)
7. [Data Display Components](#data-display-components)
8. [Animation Patterns](#animation-patterns)

---

## 🎴 Card Components

### Base Card Pattern
```tsx
interface BaseCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  clickable?: boolean
}

export const BaseCard: React.FC<BaseCardProps> = ({ 
  children, 
  className = '', 
  hover = true, 
  clickable = false 
}) => (
  <div className={`
    group relative overflow-hidden rounded-2xl 
    border border-gray-800 
    bg-gradient-to-br from-gray-900 via-gray-900 to-black
    ${hover ? 'hover:border-gray-700 hover:shadow-xl hover:shadow-black/20' : ''}
    ${clickable ? 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer' : ''}
    transition-all duration-300
    ${className}
  `}>
    {children}
  </div>
)
```

### Challenge Card Pattern
```tsx
// Key elements of ChallengeCard
const ChallengeCard = ({ challenge, onViewChallenge }) => {
  return (
    <BaseCard clickable onClick={() => onViewChallenge(challenge.id)}>
      {/* 1. Status Bar */}
      <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-600 
                      transition-all duration-300 
                      group-hover:h-1.5 animate-pulse" />
      
      <div className="p-3 sm:p-4">
        {/* 2. Header Section */}
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
          <GameInfo game={challenge.game} />
          <StatusBadge status={challenge.status} />
        </div>

        {/* 3. VS Battle Section */}
        <VSBattle 
          challenger={challenge.challenger}
          opponent={challenge.opponent}
        />

        {/* 4. Prize Pool */}
        <PrizePool amount={challenge.amount} />

        {/* 5. Rules Section */}
        <RulesSection rules={challenge.rules} />

        {/* 6. Action Button */}
        <ActionButton onClick={() => onViewChallenge(challenge.id)} />

        {/* 7. Footer Stats */}
        <CardFooter createdAt={challenge.createdAt} />
      </div>
    </BaseCard>
  )
}
```

### Sub-Component Patterns

#### GameInfo Component
```tsx
const GameInfo = ({ game }) => (
  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center 
                    rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 
                    shadow-lg shadow-amber-500/25 flex-shrink-0">
      <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
    </div>
    <div className="min-w-0 flex-1">
      <h3 className="font-bold text-white text-xs sm:text-sm truncate">
        {game.name}
      </h3>
      <p className="text-xs text-gray-400 truncate">{game.console}</p>
    </div>
  </div>
)
```

#### VSBattle Component
```tsx
const VSBattle = ({ challenger, opponent }) => (
  <div className="mb-3 sm:mb-4">
    <div className="flex items-center justify-between gap-2 sm:gap-4">
      <PlayerCard player={challenger} color="amber" />
      <VSIndicator />
      <PlayerCard player={opponent} color="purple" />
    </div>
  </div>
)

const PlayerCard = ({ player, color }) => (
  <div className="flex-1 text-center">
    <div className="relative inline-block">
      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 
                      border-2 border-${color}-500/50 
                      shadow-lg shadow-${color}-500/20">
        <AvatarImage src={player.avatar} alt={player.username} />
        <AvatarFallback className="bg-gradient-to-br from-${color}-500 to-${color}-600 
                          text-white font-bold text-xs">
          {player.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      {/* Level Badge */}
      <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 
                      rounded-full bg-gradient-to-r from-${color}-500 to-${color}-600 
                      flex items-center justify-center text-[8px] sm:text-xs 
                      font-bold text-white shadow-lg">
        {player.level}
      </div>
      
      {/* Verification Badge */}
      {player.isVerified && (
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 
                        rounded-full flex items-center justify-center">
          <CheckCircle className="h-2 w-2 text-white" />
        </div>
      )}
    </div>
    
    <p className="mt-1 font-medium text-white text-xs sm:text-sm truncate max-w-full">
      {player.username}
    </p>
    
    <div className="flex items-center justify-center gap-1 mt-0.5">
      {player.winRate && (
        <span className="text-xs text-gray-400">{player.winRate}%</span>
      )}
      <div className="flex">
        {[...Array(1)].map((_, i) => (
          <Star key={i} className="h-2 w-2 text-yellow-400 fill-current" />
        ))}
      </div>
    </div>
  </div>
)

const VSIndicator = () => (
  <div className="flex flex-col items-center justify-center px-1 sm:px-2">
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 
                      rounded-full blur-md opacity-50 animate-pulse" />
      <div className="relative h-6 w-6 sm:h-8 sm:w-8 rounded-full 
                      bg-gradient-to-r from-amber-500 to-orange-600 
                      flex items-center justify-center shadow-lg">
        <span className="text-white font-black text-[8px] sm:text-xs">VS</span>
      </div>
    </div>
  </div>
)
```

---

## 🧭 Navigation Components

### Header Pattern
```tsx
const Header = ({ activeTab, onTabChange }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 
                    bg-gradient-to-b from-black via-black/95 to-transparent 
                    backdrop-blur-md border-b border-gray-800/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 
                            flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-transparent bg-clip-text 
                         bg-gradient-to-r from-amber-400 to-orange-400">
              GAMERHOLIC
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`font-bold transition-colors ${
                  activeTab === item.id 
                    ? 'text-amber-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* User Menu */}
          <UserDropdown />
        </div>
      </div>
    </header>
  )
}
```

### Mobile Bottom Navigation Pattern
```tsx
const MobileBottomNav = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 
                   bg-gradient-to-t from-black via-black to-transparent 
                   backdrop-blur-md border-t border-gray-800/50 
                   md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl 
                       transition-all duration-200 ${
              activeTab === item.id 
                ? 'text-amber-400 bg-amber-500/10' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
```

---

## 📝 Form Components

### Search Input Pattern
```tsx
const SearchInput = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 
                     h-4 w-4 text-gray-400" />
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="pl-10 bg-gray-800/50 border-gray-600 
                     text-white placeholder-gray-500 
                     focus:border-amber-500 focus:ring-amber-500/20 
                     h-10 sm:h-12 text-sm sm:text-base rounded-xl"
    />
  </div>
)
```

### Filter Dropdown Pattern
```tsx
const FilterDropdown = ({ value, onChange, options, placeholder }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-full sm:w-32 bg-gray-800/50 border-gray-600 
                             text-white rounded-xl h-9 sm:h-10 text-xs sm:text-sm">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent className="bg-gray-800 border-gray-600 rounded-xl">
      {options.map(option => (
        <SelectItem 
          key={option.value} 
          value={option.value}
          className="text-xs sm:text-sm"
        >
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)
```

### Action Button Pattern
```tsx
const ActionButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  onClick, 
  ...props 
}) => {
  const baseClasses = "font-bold transition-all duration-300 transform rounded-xl"
  
  const variants = {
    primary: "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40",
    secondary: "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white",
    ghost: "text-gray-400 hover:text-white hover:bg-gray-800/50"
  }
  
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm",
    lg: "h-12 px-6 text-sm sm:text-base"
  }
  
  return (
    <Button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} 
                 hover:scale-[1.02] active:scale-[0.98]`}
      onClick={onClick}
      {...props}
    >
      {icon && <span className="mr-1 sm:mr-2">{icon}</span>}
      {children}
    </Button>
  )
}
```

---

## 🏷️ Status & Badge Components

### Status Badge Pattern
```tsx
const StatusBadge = ({ status, showLabel = true }) => {
  const config = statusConfig[status]
  const Icon = config.icon
  
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full 
                    ${config.bgColor} ${config.borderColor} border`}>
      <Icon className={`h-3 w-3 ${config.textColor}`} />
      {showLabel && (
        <span className={`text-xs font-medium ${config.textColor}`}>
          {config.label}
        </span>
      )}
    </div>
  )
}
```

### Priority Badge Pattern
```tsx
const PriorityBadge = ({ priority }) => {
  const configs = {
    high: { color: 'red', icon: Zap, label: 'High' },
    medium: { color: 'yellow', icon: AlertCircle, label: 'Medium' },
    low: { color: 'green', icon: CheckCircle, label: 'Low' }
  }
  
  const config = configs[priority]
  const Icon = config.icon
  
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full 
                    bg-${config.color}-500/10 border border-${config.color}-500/30`}>
      <Icon className={`h-3 w-3 text-${config.color}-400`} />
      <span className={`text-xs font-medium text-${config.color}-400`}>
        {config.label}
      </span>
    </div>
  )
}
```

### Verification Badge Pattern
```tsx
const VerificationBadge = ({ verified = true, size = 'sm' }) => {
  if (!verified) return null
  
  const sizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  }
  
  return (
    <div className={`bg-blue-500 rounded-full flex items-center justify-center 
                    ${sizes[size]}`}>
      <CheckCircle className="text-white" />
    </div>
  )
}
```

---

## 🎮 Interactive Elements

### Toggle Button Pattern
```tsx
const ToggleButton = ({ pressed, onPressedChange, children }) => (
  <button
    onClick={() => onPressedChange(!pressed)}
    className={`rounded-lg h-8 w-8 p-0 transition-colors ${
      pressed 
        ? 'bg-amber-500 text-white' 
        : 'text-gray-400 hover:text-white'
    }`}
  >
    {children}
  </button>
)
```

### Quick Action Pattern
```tsx
const QuickAction = ({ icon, label, onClick, variant = 'default' }) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    className="justify-start text-gray-400 hover:text-white hover:bg-gray-700 
               rounded-lg h-8 text-xs"
  >
    {icon && <span className="h-3 w-3 mr-2">{icon}</span>}
    {label}
  </Button>
)
```

### Chip Filter Pattern
```tsx
const ChipFilter = ({ options, selected, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(option => (
      <button
        key={option.value}
        onClick={() => onChange(option.value)}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          selected === option.value
            ? 'bg-amber-500 text-white'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
)
```

---

## 📐 Layout Components

### Section Container Pattern
```tsx
const SectionContainer = ({ children, className = '', background = 'default' }) => {
  const backgrounds = {
    default: 'bg-black',
    gradient: 'bg-gradient-to-b from-amber-500/5 via-transparent to-transparent',
    card: 'bg-gradient-to-br from-gray-900 to-gray-800'
  }
  
  return (
    <section className={`${backgrounds[background]} ${className}`}>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {children}
      </div>
    </section>
  )
}
```

### Stats Grid Pattern
```tsx
const StatsGrid = ({ stats }) => (
  <div className="grid grid-cols-3 gap-2 sm:gap-4">
    {stats.map((stat, index) => (
      <div key={index} 
           className={`bg-gradient-to-br ${stat.gradient} 
                      border ${stat.borderColor} rounded-xl p-3 sm:p-4 text-center`}>
        <div className="flex items-center justify-center gap-1 sm:gap-2 
                        text-${stat.color} mb-1">
          <stat.icon className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-lg sm:text-2xl font-black">{stat.value}</span>
        </div>
        <p className="text-[10px] sm:text-xs text-gray-400">{stat.label}</p>
      </div>
    ))}
  </div>
)
```

### Filter Panel Pattern
```tsx
const FilterPanel = ({ children, showAdvanced, onToggleAdvanced }) => (
  <div className="bg-gradient-to-br from-gray-900 to-gray-800 
                  border border-gray-700 rounded-2xl p-4 sm:p-6 shadow-xl">
    {/* Main filters */}
    <div className="space-y-4">
      {children}
    </div>
    
    {/* Advanced filters */}
    {showAdvanced && (
      <div className="mt-4 pt-4 border-t border-gray-700">
        {/* Advanced filter content */}
      </div>
    )}
    
    {/* Toggle button */}
    <Button
      variant="outline"
      size="sm"
      onClick={onToggleAdvanced}
      className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-700"
    >
      <SlidersHorizontal className="h-4 w-4 mr-2" />
      {showAdvanced ? 'Hide Filters' : 'Show Filters'}
    </Button>
  </div>
)
```

---

## 📊 Data Display Components

### Prize Pool Display Pattern
```tsx
const PrizePool = ({ amount, animated = false }) => (
  <div className="flex items-center justify-center gap-2 sm:gap-4">
    <PrizeToken 
      type="sei" 
      amount={amount.sei} 
      animated={animated}
    />
    <div className="text-gray-600 text-sm sm:text-base">+</div>
    <PrizeToken 
      type="gamer" 
      amount={amount.gamer} 
      animated={animated}
    />
  </div>
)

const PrizeToken = ({ type, amount, animated }) => {
  const config = {
    sei: { color: 'amber', symbol: 'S' },
    gamer: { color: 'purple', symbol: 'G' }
  }
  
  const { color, symbol } = config[type]
  
  return (
    <div className="text-center">
      <motion.div
        key={amount}
        initial={animated ? { scale: 1.2 } : {}}
        animate={{ scale: 1 }}
        className="flex items-center gap-1 text-${color}-400"
      >
        <div className={`h-4 w-4 sm:h-5 sm:w-5 rounded-full 
                        bg-gradient-to-r from-${color}-500 to-${color}-600 
                        flex items-center justify-center`}>
          <span className="text-[8px] sm:text-xs font-bold text-white">
            {symbol}
          </span>
        </div>
        <span className="font-bold text-sm sm:text-base">{amount}</span>
      </motion.div>
      <p className="text-[8px] sm:text-xs text-gray-400 mt-0.5">
        {type.toUpperCase()}
      </p>
    </div>
  )
}
```

### Progress Bar Pattern
```tsx
const ProgressBar = ({ value, max = 100, color = 'amber', animated = true }) => (
  <div className="w-full">
    <div className="flex justify-between text-xs text-gray-400 mb-1">
      <span>Progress</span>
      <span>{Math.round((value / max) * 100)}%</span>
    </div>
    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
      {animated ? (
        <motion.div
          className={`h-full bg-gradient-to-r from-${color}-500 to-${color}-600`}
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      ) : (
        <div 
          className={`h-full bg-gradient-to-r from-${color}-500 to-${color}-600`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      )}
    </div>
  </div>
)
```

---

## ✨ Animation Patterns

### Hover Animation Pattern
```tsx
const AnimatedCard = ({ children, ...props }) => (
  <motion.div
    whileHover={{ 
      scale: 1.02, 
      rotateY: 5,
      rotateX: -5,
      z: 50,
      transition: { duration: 0.3 }
    }}
    whileTap={{ scale: 0.98 }}
    {...props}
  >
    {children}
  </motion.div>
)
```

### Stagger Animation Pattern
```tsx
const StaggeredList = ({ items }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1
        }
      }
    }}
  >
    {items.map((item, index) => (
      <motion.div
        key={index}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        }}
      >
        {item}
      </motion.div>
    ))}
  </motion.div>
)
```

### Pulse Animation Pattern
```tsx
const PulseIndicator = ({ children, className = '' }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 
                    rounded-full blur-lg opacity-50 animate-pulse" />
    <div className="relative">
      {children}
    </div>
  </div>
)
```

---

## 🎯 Usage Guidelines

### When to Use Which Pattern

1. **Cards**: Use for any discrete piece of information (challenges, players, games)
2. **Status Badges**: Use for state indicators (challenge status, player verification)
3. **Action Buttons**: Use for primary actions (create, join, view)
4. **Quick Actions**: Use for secondary actions (filter, sort, share)
5. **Progress Bars**: Use for multi-step processes or completion tracking

### Performance Considerations

1. **Animations**: Use `transform` instead of layout properties
2. **Images**: Implement lazy loading for avatar images
3. **Lists**: Use virtualization for long lists
4. **State**: Minimize re-renders with proper memoization

### Accessibility Guidelines

1. **Buttons**: Minimum 44px touch targets
2. **Color**: Don't rely on color alone for status indication
3. **Keyboard**: Ensure all interactive elements are keyboard accessible
4. **Screen Readers**: Use proper ARIA labels and semantic HTML

---

*This pattern library should be used as a reference for building consistent, maintainable components across the Gamerholic platform.*