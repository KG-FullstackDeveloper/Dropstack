import {
  useState,
  type FormEvent,
} from "react";

import {
  Star,
  X,
} from "lucide-react";

import type {
  ReviewSubmission,
} from "../../types/review";

interface ReviewModalProps {
  open: boolean;
  productId: string;
  productName: string;
  onClose: () => void;
  onSubmit?: (
    review: ReviewSubmission
  ) => Promise<void> | void;
}

export default function ReviewModal({
  open,
  productId,
  productName,
  onClose,
  onSubmit,
}: ReviewModalProps) {
  const [rating, setRating] =
    useState(0);

  const [hoverRating, setHoverRating] =
    useState(0);

  const [customerName, setCustomerName] =
    useState("");

  const [customerEmail, setCustomerEmail] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [body, setBody] =
    useState("");

  const [submitted, setSubmitted] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  if (!open) {
    return null;
  }

  const activeRating =
    hoverRating || rating;

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (rating === 0) {
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit?.({
        productId,
        customerName,
        customerEmail,
        rating,
        title,
        body,
      });

      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setCustomerName("");
    setCustomerEmail("");
    setTitle("");
    setBody("");
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative my-8 w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close review form"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X size={20} />
        </button>

        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8"
          >
            <div className="pr-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Customer review
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                Review {productName}
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Tell other customers about
                your experience.
              </p>
            </div>

            <div className="mt-7">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                How would you rate this product?
              </p>

              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(
                  (star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() =>
                        setHoverRating(star)
                      }
                      onMouseLeave={() =>
                        setHoverRating(0)
                      }
                      onClick={() =>
                        setRating(star)
                      }
                      aria-label={`${star} star rating`}
                      className="rounded-md p-1"
                    >
                      <Star
                        size={28}
                        fill={
                          star <=
                          activeRating
                            ? "currentColor"
                            : "none"
                        }
                        className={
                          star <=
                          activeRating
                            ? "text-yellow-400"
                            : "text-slate-300"
                        }
                      />
                    </button>
                  )
                )}
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {rating === 0
                  ? "Select a star rating."
                  : `${rating} out of 5 stars`}
              </p>
            </div>

            <div className="mt-6 grid gap-4">
              <div>
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Your name
                </label>

                <input
                  required
                  value={customerName}
                  onChange={(event) =>
                    setCustomerName(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Email
                </label>

                <input
                  required
                  type="email"
                  value={customerEmail}
                  onChange={(event) =>
                    setCustomerEmail(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="you@example.com"
                />

                <p className="mt-1 text-xs text-slate-500">
                  We'll use this email for
                  review-related notifications.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Review title
                </label>

                <input
                  required
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="Summarize your experience"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Your review
                </label>

                <textarea
                  required
                  rows={5}
                  value={body}
                  onChange={(event) =>
                    setBody(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="What did you like or dislike?"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={
                submitting || rating === 0
              }
              className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {submitting
                ? "Submitting..."
                : "Submit review"}
            </button>
          </form>
        ) : (
          <div className="p-8 text-center sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Star
                size={25}
                fill="currentColor"
              />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">
              Thank you for your review
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Your review has been submitted.
              We'll send review-related
              notifications to the email
              you provided.
            </p>

            <button
              type="button"
              onClick={handleClose}
              className="mt-6 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}