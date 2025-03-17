import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface PrizeAvatarProps {
  imageSrc: string
  prizeName: string
  timeLeft: any
  winner: string
  status: number
  prize_token: string
}

export function PrizeAvatar({ imageSrc, prizeName, timeLeft, winner, status, prize_token }: PrizeAvatarProps) {
  if(timeLeft<0){
    timeLeft = 0
  }
  return (
    <div className="flex flex-col items-center mb-6">
      <Avatar className="w-32 h-32 mb-4 border-4 border-white">
        <AvatarImage src={imageSrc} alt={prizeName} />
        <AvatarFallback>{prizeName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="text-center">
      <h2 className="text-2xl font-bold text-primary mb-2">{winner}</h2>

        {/* <h2 className="text-2xl font-bold text-primary mb-2">{prizeName} {prize_token == 'solana' && ('SOL')} {prize_token == 'GAMER' && ('GAMER')}</h2> */}
        {status==1 && (
            <p className="text-xl text-primary/80 mb-2">waiting on more players...</p>
        )}
        {status==2 && (
            <p className="text-xl text-primary/80 mb-2">minimum players reached</p>
        )}
        {status == 2 && (
            <p className="text-xl text-primary/80 mb-2">Starts In: {timeLeft}</p>
        )}
        {status == 3 && winner!='No winner yet' && (
            <p className="text-xl text-primary/80 mb-2">Time Left: <span className="font-bold">{timeLeft}</span></p>
        )}
        {status == 3 && winner=='No winner yet' && (
            <p className="text-xl text-white/80 mb-2 font-bold">- click grab -</p>
        )}
        {status == 4 && (
            <p className="text-xl text-primary/80 mb-2">game over!</p>
        )}
        {status>2 && (
            <p className="text-lg text-primary/70">{prizeName} {prize_token == 'solana' && ('SOL')} {prize_token == 'GAMER' && ('GAMER')}</p>
        )}
      </div>
    </div>
  )
}

