// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ApiProperty, ApiUser } from "../../lib/api";
import en from "../../i18n/dictionaries/en";
import { I18nProvider } from "../../i18n/I18nProvider";
import { AuthProvider, useAuth } from "../../providers/AuthProvider";
import ClientAccount from "./ClientAccount";

vi.mock("../../lib/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../lib/api")>();
  return {
    ...original,
    api: { ...original.api, session: vi.fn(), favorites: vi.fn(), removeFavorite: vi.fn(), addFavorite: vi.fn(), logout: vi.fn() },
  };
});
const { api, SESSION_MARKER } = await import("../../lib/api");
const mocked = vi.mocked(api);

const user: ApiUser = { id: 7, name: "Test Client", email: "client@example.com", roles: [{ id: 1, name: "client" }] };
const property = {
  id: 1, slug: "palm-villa", title_en: "Palm Villa", title_ar: "فيلا النخلة", operation: "sale", price: "1000000", area: "900",
  type_id: 1, city_id: 1, images: [],
} as ApiProperty;

/** Stands in for the heart on a listing card: it reads the same shared state. */
function Heart() {
  const { favoriteIds } = useAuth();
  return <span data-testid="heart">{favoriteIds.has(1) ? "saved" : "empty"}</span>;
}

function renderAccount() {
  return render(
    <I18nProvider lang="en" dict={en}>
      <AuthProvider>
        <Heart />
        <ClientAccount user={user} token={SESSION_MARKER} setView={() => undefined} />
      </AuthProvider>
    </I18nProvider>,
  );
}

beforeEach(() => {
  mocked.session.mockResolvedValue({ user });
  mocked.favorites.mockResolvedValue({ favorites: [{ property }] });
  mocked.removeFavorite.mockResolvedValue({});
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("removing a favorite from the client account", () => {
  it("updates every heart on the site, not just the list", async () => {
    renderAccount();
    await waitFor(() => expect(screen.getByTestId("heart")).toHaveTextContent("saved"));

    fireEvent.click(await screen.findByRole("button", { name: "Remove from favorites" }));

    await waitFor(() => expect(screen.getByTestId("heart")).toHaveTextContent("empty"));
    expect(mocked.removeFavorite).toHaveBeenCalledWith(1, SESSION_MARKER);
    await waitFor(() => expect(screen.queryByText("Palm Villa")).not.toBeInTheDocument());
  });

  it("keeps the heart and the card, and says why, when the server refuses", async () => {
    mocked.removeFavorite.mockRejectedValue(new Error("server down"));
    renderAccount();
    await waitFor(() => expect(screen.getByTestId("heart")).toHaveTextContent("saved"));

    fireEvent.click(await screen.findByRole("button", { name: "Remove from favorites" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not remove this property from your favorites.");
    expect(screen.getByTestId("heart")).toHaveTextContent("saved");
    expect(screen.getByText("Palm Villa")).toBeInTheDocument();
  });
});
