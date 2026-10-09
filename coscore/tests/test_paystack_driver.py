import pytest
from unittest.mock import patch, MagicMock

# Import the driver class from the app
from coscore.utils.payment.paystack import PaystackDriver

@pytest.fixture
def mock_setting():
    """Mock the Coscore Payment Gateway Setting doc."""
    mock = MagicMock()
    mock.public_key = "pk_test_123"
    mock.secret_key = "sk_test_456"
    return mock

@pytest.fixture
def driver(mock_setting):
    """Create a PaystackDriver instance with a patched frappe.get_doc."""
    with patch("frappe.get_doc", return_value=mock_setting):
        yield PaystackDriver()

def test_initiate_payment_success(driver):
    """Verify that `initiate_payment` builds the correct request and returns data."""
    # Mock order document
    order_doc = MagicMock()
    order_doc.name = "ORD-123456"
    order_doc.customer_email = "customer@example.com"
    order_doc.grand_total = 99.99

    # Expected payload sent to Paystack
    expected_payload = {
        "email": "customer@example.com",
        "amount": int(99.99 * 100),  # kobo
        "callback_url": driver.default_callback,
        "reference": "ORD-123456",
    }

    # Mock the HTTP POST request
    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = {
        "data": {
            "authorization_url": "https://paystack.com/pay/abc123",
            "reference": "ORD-123456",
        }
    }

    with patch("requests.post", return_value=mock_resp) as mock_post:
        result = driver.initiate_payment(order_doc, amount=None)

    mock_post.assert_called_once_with(
        "https://api.paystack.co/transaction/initialize",
        json=expected_payload,
        headers={"Authorization": f"Bearer {driver.secret_key}"},
    )
    assert result == {
        "payment_url": "https://paystack.com/pay/abc123",
        "gateway_reference": "ORD-123456",
    }

def test_verify_ipn_success(driver):
    """Validate successful IPN verification."""
    request_data = {"reference": "ORD-123456"}

    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = {
        "data": {
            "status": "success",
            "reference": "ORD-123456",
        }
    }

    with patch("requests.get", return_value=mock_resp) as mock_get:
        result = driver.verify_ipn(request_data)

    mock_get.assert_called_once_with(
        "https://api.paystack.co/transaction/verify/ORD-123456",
        headers={"Authorization": f"Bearer {driver.secret_key}"},
    )
    assert result == {"success": True, "transaction_id": "ORD-123456"}

def test_verify_ipn_missing_reference(driver):
    """Ensure the driver handles a missing reference gracefully."""
    result = driver.verify_ipn({})
    assert result == {"success": False, "error": "Missing reference"}
