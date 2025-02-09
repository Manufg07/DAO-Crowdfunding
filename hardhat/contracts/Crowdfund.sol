// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Crowdfund is Ownable {
    struct Campaign {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 goal;
        uint256 raised;
        bool isApproved;
        bool isCompleted;
    }

    mapping(uint256 => Campaign) public campaigns;
    uint256 public campaignCount;

    event CampaignCreated(uint256 id, address creator, string title, uint256 goal);
    event CampaignApproved(uint256 id);
    event Funded(uint256 id, address backer, uint256 amount);
    event FundsReleased(uint256 id, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _goal
    ) external {
        campaignCount++;
        campaigns[campaignCount] = Campaign({
            id: campaignCount,
            creator: msg.sender,
            title: _title,
            description: _description,
            goal: _goal,
            raised: 0,
            isApproved: false,
            isCompleted: false
        });

        emit CampaignCreated(campaignCount, msg.sender, _title, _goal);
    }

    function approveCampaign(uint256 _id) external onlyOwner {
        require(!campaigns[_id].isApproved, "Campaign already approved");
        campaigns[_id].isApproved = true;
        emit CampaignApproved(_id);
    }

    function fundCampaign(uint256 _id) external payable {
        Campaign storage campaign = campaigns[_id];
        require(campaign.isApproved, "Campaign not approved");
        require(!campaign.isCompleted, "Campaign already completed");
        require(msg.value > 0, "Funding amount must be greater than 0");

        campaign.raised += msg.value;
        emit Funded(_id, msg.sender, msg.value);

        if (campaign.raised >= campaign.goal) {
            campaign.isCompleted = true;
        }
    }

    function releaseFunds(uint256 _id) external onlyOwner {
        Campaign storage campaign = campaigns[_id];
        require(campaign.isCompleted, "Campaign not completed");
        require(!campaign.isApproved, "Funds already released");

        uint256 amount = campaign.raised;
        campaign.raised = 0;
        payable(campaign.creator).transfer(amount);

        emit FundsReleased(_id, amount);
    }
}