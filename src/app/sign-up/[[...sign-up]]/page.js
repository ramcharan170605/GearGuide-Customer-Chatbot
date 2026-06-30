import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* GearGuide Brand Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <span className="font-bold text-lg">G</span>
          </div>
          <span className="text-xl font-bold tracking-tight">GearGuide AI</span>
        </div>
        
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium h-9 px-4 rounded-xl transition-all shadow-xs",
              card: 
                "bg-card/75 border border-border/80 shadow-md rounded-2xl backdrop-blur-md",
              headerTitle: "text-foreground font-bold",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: 
                "border border-border/80 bg-background hover:bg-secondary/50 text-foreground rounded-xl transition-all",
              formFieldLabel: "text-muted-foreground font-medium",
              formFieldInput: 
                "border-border/80 bg-background/50 hover:bg-background focus:border-primary text-foreground rounded-xl transition-all",
              footerActionLink: "text-primary hover:underline",
            }
          }}
        />
      </div>
    </div>
  );
}
