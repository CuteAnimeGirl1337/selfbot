#!/bin/bash
echo "Installing selfbot service..."
sudo cp selfbot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable selfbot
sudo systemctl start selfbot
echo "Done! Check status: sudo systemctl status selfbot"
