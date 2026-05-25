import SubscriptionThemeProvider from "@/features/subscription/components/SubscriptionThemeProvider"
import PricingSection from "@/features/subscription/components/PricingSection"

const PlansPage = () => {
    return (
        <SubscriptionThemeProvider>

            <PricingSection onNotify={() => { console.log("notify") }} onSelectPlan={() => { console.log("Plan A is selected") }} />
        </SubscriptionThemeProvider>
    )
}

export default PlansPage