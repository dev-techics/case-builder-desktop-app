import PricingSection from "./components/PricingSection"
import SubscriptionThemeProvider from "./components/SubscriptionThemeProvider"

const Subscription = () => {
  return (
    <SubscriptionThemeProvider>
      <PricingSection  />
    </SubscriptionThemeProvider>
  )
}

export default Subscription