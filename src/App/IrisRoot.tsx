/**
 * IRIS MVP entry point.
 *
 * App.tsx owns the full product flow (Landing -> Parent Mode -> Registration
 * -> Child Mode -> legacy activities -> Parent Dashboard -> Chatbot) and
 * wraps everything in the providers the tree needs, including IrisProvider
 * for the adaptive engine context. This file used to instantiate IrisFlow
 * directly with its own provider stack; that provider has since moved up
 * into App.tsx so engine state survives navigation into legacy game screens
 * and back. Rendering IrisFlow outside of App's provider tree now throws
 * ("useIris must be used within IrisProvider"), so this root simply defers
 * to App.
 */
import App from './App';

export default function IrisRoot() {
  return <App />;
}
